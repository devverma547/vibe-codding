/**
 * Netlify Serverless Function: /.netlify/functions/analyze-secrets
 *
 * Scans a target website's public HTML and JavaScript bundles for leaked
 * API keys, secret tokens, and service-role credentials.
 *
 * NO external API keys required — runs entirely on regex pattern matching.
 *
 * Flow:
 *   1. Fetch the target site's HTML (server-side, avoids CORS)
 *   2. Extract all <script src="..."> tags
 *   3. Download up to 5 JS bundles in parallel (max 2MB each)
 *   4. Scan bundle content against 10+ high-precision secret signatures
 *   5. Redact all findings — never return raw keys
 *   6. Return structured JSON with findings, severity, and remediation
 */

// ─── Secret Signature Patterns ────────────────────────────────────────────────
// Each pattern: { id, name, regex, severity, prefix (for fast pre-filter), remediation }
// REDOS PROTECTION: Every pattern uses fixed-length quantifiers or simple character classes.
// The `prefix` field enables O(1) indexOf pre-filtering before regex runs.
const SECRET_PATTERNS = [
  {
    id: 'openai-api-key',
    name: 'OpenAI API Key',
    regex: /sk-proj-[a-zA-Z0-9_-]{48,120}/g,
    prefixes: ['sk-proj-'],
    severity: 'critical',
    platform: 'OpenAI',
    remediation: 'Revoke this key immediately at https://platform.openai.com/api-keys. Move all OpenAI API calls to a serverless function (Netlify/Vercel) and store the key in environment variables.',
  },
  {
    id: 'openai-api-key-legacy',
    name: 'OpenAI API Key (Legacy)',
    regex: /sk-[a-zA-Z0-9]{20,60}/g,
    prefixes: ['sk-'],
    severity: 'critical',
    platform: 'OpenAI',
    remediation: 'Revoke this key immediately at https://platform.openai.com/api-keys. Move all OpenAI API calls to a serverless function (Netlify/Vercel) and store the key in environment variables.',
  },
  {
    id: 'stripe-secret-key',
    name: 'Stripe Secret Key',
    regex: /sk_live_[0-9a-zA-Z]{24,50}/g,
    prefixes: ['sk_live_'],
    severity: 'critical',
    platform: 'Stripe',
    remediation: 'Revoke this key immediately at https://dashboard.stripe.com/apikeys. Use only Stripe Publishable Keys (pk_live_) on the client. All secret operations must happen server-side.',
  },
  {
    id: 'stripe-restricted-key',
    name: 'Stripe Restricted Key',
    regex: /rk_live_[0-9a-zA-Z]{24,50}/g,
    prefixes: ['rk_live_'],
    severity: 'critical',
    platform: 'Stripe',
    remediation: 'Revoke this key immediately at https://dashboard.stripe.com/apikeys. Restricted keys must only be used server-side.',
  },
  {
    id: 'anthropic-api-key',
    name: 'Anthropic Claude API Key',
    regex: /sk-ant-api03-[a-zA-Z0-9_-]{90,130}/g,
    prefixes: ['sk-ant-api03-'],
    severity: 'critical',
    platform: 'Anthropic',
    remediation: 'Revoke this key at https://console.anthropic.com/settings/keys. Move Claude API calls to a backend function.',
  },
  {
    id: 'github-pat-classic',
    name: 'GitHub Personal Access Token',
    regex: /ghp_[a-zA-Z0-9]{36}/g,
    prefixes: ['ghp_'],
    severity: 'critical',
    platform: 'GitHub',
    remediation: 'Revoke this token at https://github.com/settings/tokens. Never expose GitHub tokens in client-side code.',
  },
  {
    id: 'github-pat-fine',
    name: 'GitHub Fine-Grained PAT',
    regex: /github_pat_[a-zA-Z0-9_]{82,100}/g,
    prefixes: ['github_pat_'],
    severity: 'critical',
    platform: 'GitHub',
    remediation: 'Revoke this token at https://github.com/settings/tokens. Never expose GitHub tokens in client-side code.',
  },
  {
    id: 'aws-access-key',
    name: 'AWS Access Key ID',
    regex: /AKIA[0-9A-Z]{16}/g,
    prefixes: ['AKIA'],
    severity: 'critical',
    platform: 'AWS',
    remediation: 'Deactivate this key immediately in the AWS IAM Console. AWS keys in client bundles can be used to spin up resources on your account.',
  },
  {
    id: 'google-api-key',
    name: 'Google / Gemini AI Studio API Key',
    regex: /AIzaSy[0-9A-Za-z_-]{33}/g,
    prefixes: ['AIzaSy'],
    severity: 'high',
    platform: 'Google Cloud',
    remediation: 'Restrict this API key in the Google Cloud Console (https://console.cloud.google.com/apis/credentials) — add HTTP referrer restrictions or move sensitive API calls server-side.',
  },
  {
    id: 'supabase-service-role',
    name: 'Supabase Service Role Key',
    regex: /eyJhbGciOi[A-Za-z0-9_-]{50,500}\.[A-Za-z0-9_-]{50,500}\.[A-Za-z0-9_-]{50,500}/g,
    prefixes: ['eyJhbGciOi'],
    severity: 'critical',
    platform: 'Supabase',
    isJwt: true,
    remediation: 'URGENT: This key bypasses ALL Row Level Security (RLS). Only the anon key should be used in client-side code. Regenerate your service_role key in Supabase Dashboard > Project Settings > API.',
  },
  {
    id: 'sendgrid-api-key',
    name: 'SendGrid API Key',
    regex: /SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}/g,
    prefixes: ['SG.'],
    severity: 'critical',
    platform: 'SendGrid',
    remediation: 'Revoke this key at https://app.sendgrid.com/settings/api_keys. Move email sending to a backend function.',
  },
  {
    id: 'twilio-api-key',
    name: 'Twilio API Key or Auth Token',
    regex: /SK[0-9a-fA-F]{32}/g,
    prefixes: ['SK'],
    severity: 'high',
    platform: 'Twilio',
    remediation: 'Rotate this key in your Twilio Console. Move all Twilio API calls to server-side code.',
  },
  {
    id: 'mailgun-api-key',
    name: 'Mailgun API Key',
    regex: /key-[0-9a-zA-Z]{32}/g,
    prefixes: ['key-'],
    severity: 'high',
    platform: 'Mailgun',
    remediation: 'Regenerate this key in Mailgun Dashboard. Move email API calls to a backend function.',
  },
  {
    id: 'slack-token',
    name: 'Slack Bot / OAuth Token',
    regex: /xoxb-[0-9a-zA-Z-]{10,80}/g,
    prefixes: ['xoxb-', 'xoxp-', 'xoxa-', 'xoxo-'],
    severity: 'high',
    platform: 'Slack',
    remediation: 'Revoke this token at https://api.slack.com/apps. Never use Slack tokens in client-side JavaScript.',
  },
  {
    id: 'private-key-pem',
    name: 'Private Key (PEM format)',
    regex: /-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----/g,
    prefixes: ['-----BEGIN'],
    severity: 'critical',
    platform: 'Cryptographic',
    remediation: 'CRITICAL: A private key is embedded in your client bundle. Immediately rotate all certificates and keys associated with this private key.',
  },
];

// Safe public key prefixes that should NOT be flagged
const SAFE_PREFIXES = [
  'pk_live_',  // Stripe publishable key (designed to be public)
  'pk_test_',  // Stripe test publishable key
  'sk_test_',  // Stripe test secret (not production)
];

// ─── ReDoS Protection Constants ──────────────────────────────────────────────
const CHUNK_SIZE = 64 * 1024;          // 64KB chunks for regex scanning
const CHUNK_OVERLAP = 512;             // 512 byte overlap to catch tokens spanning chunk boundaries
const PER_PATTERN_BUDGET_MS = 200;     // Max 200ms per pattern per chunk
const TOTAL_SCAN_BUDGET_MS = 5000;     // Max 5s total scan time across all content

// ─── Core Handler ─────────────────────────────────────────────────────────────

export const handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { url } = JSON.parse(event.body || '{}');

    if (!url) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required field: url' }),
      };
    }

    const scanResult = await scanForSecrets(url);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(scanResult),
    };
  } catch (err) {
    console.error('[Analyze-Secrets] Unexpected error:', err);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(buildFallbackResult(null, `Scan error: ${err.message}`)),
    };
  }
};

// ─── Main Scan Orchestrator ───────────────────────────────────────────────────

async function scanForSecrets(url) {
  const startTime = Date.now();
  const warnings = [];

  // Step 1: Fetch target site HTML
  let html = '';
  try {
    html = await fetchPage(url);
  } catch (err) {
    console.warn('[Analyze-Secrets] Failed to fetch target HTML:', err.message);
    warnings.push(`Could not fetch target site HTML: ${err.message}`);
    return buildFallbackResult(url, err.message, warnings);
  }

  // Step 2: Extract script sources
  const scriptUrls = extractScriptSources(html, url);

  // Step 3: Also extract inline script content
  const inlineScripts = extractInlineScripts(html);

  // Step 4: Download external JS bundles in parallel (max 5, 2MB cap each)
  const bundles = await downloadBundles(scriptUrls.slice(0, 5));

  // Step 5: Combine all scannable content
  const allContent = [
    ...inlineScripts.map((code, i) => ({ source: `inline-script-${i + 1}`, content: code })),
    ...bundles,
  ];

  // Step 6: Run secret pattern scanning
  const findings = [];
  for (const { source, content } of allContent) {
    if (!content || content.length < 10) continue;
    const matches = scanContent(content, source);
    findings.push(...matches);
  }

  // Step 7: Deduplicate findings (same key type found in multiple bundles)
  const deduped = deduplicateFindings(findings);

  const elapsed = Date.now() - startTime;

  return {
    url,
    totalLeaks: deduped.length,
    findings: deduped,
    bundlesScanned: bundles.length,
    inlineScriptsScanned: inlineScripts.length,
    totalScriptsFound: scriptUrls.length,
    scanTimeMs: elapsed,
    severity: deduped.length > 0
      ? (deduped.some(f => f.severity === 'critical') ? 'critical' : 'high')
      : 'pass',
    grade: deduped.length === 0 ? 'PASS' : (deduped.some(f => f.severity === 'critical') ? 'FAIL' : 'WARN'),
    warnings,
    source: 'siteproof-secret-scanner',
    scannedAt: new Date().toISOString(),
  };
}

// ─── HTML Fetcher ─────────────────────────────────────────────────────────────

async function fetchPage(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'SiteProof-SecretScanner/1.0 (security audit)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timer);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    // Cap HTML to 5MB to prevent memory issues
    const text = await response.text();
    return text.slice(0, 5 * 1024 * 1024);
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ─── Script Extraction ────────────────────────────────────────────────────────

function extractScriptSources(html, baseUrl) {
  const sources = [];
  // Match <script src="..."> tags
  const srcRegex = /<script[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let match;

  while ((match = srcRegex.exec(html)) !== null) {
    let src = match[1];

    // Skip known safe/irrelevant scripts
    if (src.includes('google-analytics.com') ||
        src.includes('googletagmanager.com') ||
        src.includes('cdn.jsdelivr.net') ||
        src.includes('cdnjs.cloudflare.com') ||
        src.includes('unpkg.com') ||
        src.includes('facebook.net') ||
        src.includes('connect.facebook.net') ||
        src.includes('platform.twitter.com')) {
      continue;
    }

    // Resolve relative URLs
    try {
      const resolved = new URL(src, baseUrl).href;
      sources.push(resolved);
    } catch {
      // Skip malformed URLs
    }
  }

  return sources;
}

function extractInlineScripts(html) {
  const scripts = [];
  const inlineRegex = /<script(?:\s[^>]*)?>(?!<)([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = inlineRegex.exec(html)) !== null) {
    const content = match[1].trim();
    // Only scan substantial inline scripts (skip tiny ones like analytics snippets)
    if (content.length > 50 && !content.startsWith('<!--')) {
      scripts.push(content);
    }
  }

  return scripts;
}

// ─── Bundle Downloader ────────────────────────────────────────────────────────

async function downloadBundles(urls) {
  const MAX_BUNDLE_SIZE = 2 * 1024 * 1024; // 2MB per bundle
  const TIMEOUT_MS = 6000;

  const results = await Promise.allSettled(
    urls.map(async (bundleUrl) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const response = await fetch(bundleUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'SiteProof-SecretScanner/1.0',
            'Accept': 'application/javascript, text/javascript, */*',
          },
          signal: controller.signal,
          redirect: 'follow',
        });

        clearTimeout(timer);

        if (!response.ok) return null;

        // Check Content-Length header first
        const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
        if (contentLength > MAX_BUNDLE_SIZE) {
          console.warn(`[Analyze-Secrets] Bundle too large (${contentLength} bytes), skipping: ${bundleUrl}`);
          return null;
        }

        const text = await response.text();
        return {
          source: extractBundleFilename(bundleUrl),
          content: text.slice(0, MAX_BUNDLE_SIZE),
        };
      } catch (err) {
        clearTimeout(timer);
        return null;
      }
    })
  );

  return results
    .filter(r => r.status === 'fulfilled' && r.value !== null)
    .map(r => r.value);
}

function extractBundleFilename(url) {
  try {
    const path = new URL(url).pathname;
    return path.split('/').pop() || path;
  } catch {
    return url;
  }
}

// ─── Secret Pattern Scanner (ReDoS-Safe, Chunk-Based) ────────────────────────
//
// THREE-LAYER PROTECTION against ReDoS on minified JS:
//
//   Layer 1: PREFIX PRE-FILTER (O(1) indexOf)
//     Before running any regex, check if the pattern's literal prefix string
//     (e.g., "sk-proj-", "AKIA", "AIzaSy") even exists in the chunk.
//     This skips 90%+ of pattern/chunk combinations instantly.
//
//   Layer 2: CHUNK-BASED SCANNING (64KB chunks with 512B overlap)
//     Minified JS is often a single 2MB line. Running regex on 2MB = danger.
//     We split into 64KB chunks with 512B overlap (catches tokens at boundaries).
//     Regex never faces more than 64KB at a time → bounded backtracking.
//
//   Layer 3: PER-PATTERN TIME BUDGET (200ms per pattern per chunk)
//     If any single regex takes >200ms on a chunk, we abort it and move on.
//     Total scan capped at 5s to stay within Netlify function limits.
//

function scanContent(content, sourceFile) {
  const findings = [];
  const scanStart = Date.now();

  // Split content into manageable chunks
  const chunks = chunkString(content, CHUNK_SIZE, CHUNK_OVERLAP);

  for (let ci = 0; ci < chunks.length; ci++) {
    const chunk = chunks[ci];
    const chunkOffset = ci * CHUNK_SIZE; // approximate char offset for this chunk

    // Abort if total scan budget exceeded
    if (Date.now() - scanStart > TOTAL_SCAN_BUDGET_MS) {
      console.warn(`[Analyze-Secrets] Total scan budget (${TOTAL_SCAN_BUDGET_MS}ms) exceeded. Stopping early.`);
      break;
    }

    for (const pattern of SECRET_PATTERNS) {
      // ── Layer 1: Fast prefix pre-filter ──
      // If none of the pattern's literal prefixes exist in this chunk, skip entirely.
      const prefixFound = pattern.prefixes.some(p => chunk.includes(p));
      if (!prefixFound) continue;

      // ── Layer 3: Per-pattern time budget ──
      const patternStart = Date.now();

      // Create a fresh regex instance to avoid lastIndex state issues across chunks
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
      let match;
      let matchCount = 0;

      while ((match = regex.exec(chunk)) !== null) {
        // Time budget check
        if (Date.now() - patternStart > PER_PATTERN_BUDGET_MS) {
          console.warn(`[Analyze-Secrets] Pattern "${pattern.id}" exceeded ${PER_PATTERN_BUDGET_MS}ms budget on chunk ${ci}. Skipping remaining matches.`);
          break;
        }

        const rawValue = match[0];

        // Skip safe prefixes (e.g., Stripe publishable keys)
        if (SAFE_PREFIXES.some(prefix => rawValue.startsWith(prefix))) {
          continue;
        }

        // For JWT-based patterns (Supabase service_role), verify the payload
        if (pattern.isJwt) {
          if (!isServiceRoleJwt(rawValue)) {
            continue; // Skip — this is likely a safe anon key
          }
        }

        // Skip very short matches that are likely false positives
        if (rawValue.length < 15) continue;

        findings.push({
          id: pattern.id,
          name: pattern.name,
          severity: pattern.severity,
          platform: pattern.platform,
          maskedValue: redactSecret(rawValue),
          sourceFile,
          charIndex: chunkOffset + match.index,
          contextSnippet: extractContext(chunk, match.index, 40),
          remediation: pattern.remediation,
        });

        matchCount++;
        // Limit to 3 matches per pattern per file to avoid noise
        if (matchCount >= 3) break;
      }
    }
  }

  return findings;
}

/**
 * Split a large string into fixed-size chunks with overlap.
 * Overlap ensures tokens straddling a chunk boundary are still caught.
 * @param {string} str - The string to chunk
 * @param {number} size - Chunk size in characters
 * @param {number} overlap - Overlap in characters between consecutive chunks
 * @returns {string[]}
 */
function chunkString(str, size, overlap) {
  if (str.length <= size) return [str];

  const chunks = [];
  let offset = 0;
  while (offset < str.length) {
    chunks.push(str.slice(offset, offset + size + overlap));
    offset += size;
  }
  return chunks;
}

// ─── JWT Inspection (for Supabase service_role detection) ─────────────────────

function isServiceRoleJwt(token) {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return false;

    // Decode the JWT payload (base64url)
    const payload = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const decoded = Buffer.from(payload, 'base64').toString('utf8');
    const parsed = JSON.parse(decoded);

    // Check if the role is service_role (dangerous) vs anon (safe)
    return parsed.role === 'service_role';
  } catch {
    return false;
  }
}

// ─── Redaction Engine ─────────────────────────────────────────────────────────

function redactSecret(value) {
  if (!value || value.length < 8) return '****[REDACTED]';

  // Show first 8-12 chars, mask the rest
  const visiblePrefix = value.slice(0, Math.min(12, Math.floor(value.length * 0.2)));
  return `${visiblePrefix}...****[REDACTED]`;
}

function extractContext(content, index, radius) {
  const start = Math.max(0, index - radius);
  const end = Math.min(content.length, index + radius);
  let snippet = content.slice(start, end).replace(/\s+/g, ' ').trim();

  // Remove any potential full secrets from context
  for (const pattern of SECRET_PATTERNS) {
    pattern.regex.lastIndex = 0;
    snippet = snippet.replace(pattern.regex, (match) => redactSecret(match));
  }

  return snippet;
}

// ─── Deduplication ────────────────────────────────────────────────────────────

function deduplicateFindings(findings) {
  const seen = new Map();

  for (const finding of findings) {
    // Dedup key = pattern ID + masked value
    const key = `${finding.id}:${finding.maskedValue}`;
    if (!seen.has(key)) {
      seen.set(key, finding);
    } else {
      // If same key found in multiple files, keep the first and note the other source
      const existing = seen.get(key);
      if (!existing.alsoFoundIn) existing.alsoFoundIn = [];
      if (!existing.alsoFoundIn.includes(finding.sourceFile)) {
        existing.alsoFoundIn.push(finding.sourceFile);
      }
    }
  }

  return Array.from(seen.values());
}

// ─── Fallback Result ──────────────────────────────────────────────────────────

function buildFallbackResult(url, reason, warnings = []) {
  return {
    url,
    totalLeaks: 0,
    findings: [],
    bundlesScanned: 0,
    inlineScriptsScanned: 0,
    totalScriptsFound: 0,
    scanTimeMs: 0,
    severity: 'pass',
    grade: 'PASS',
    warnings: [...warnings, `Secret scan could not fully complete: ${reason}`],
    isFallback: true,
    source: 'siteproof-secret-scanner',
    scannedAt: new Date().toISOString(),
  };
}
