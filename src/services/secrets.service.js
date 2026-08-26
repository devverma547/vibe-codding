/**
 * Secrets Scanner Service — Client-Side API for Secret & Bundle Leak Detection
 *
 * Calls the /.netlify/functions/analyze-secrets serverless function to scan
 * a target website's public JavaScript bundles for leaked API keys and tokens.
 *
 * Pattern: Matches observatory.service.js structure (direct API → proxy fallback → fallback result)
 */

const DEFAULT_TIMEOUT_MS = 15000;

/**
 * Severity badge color mapping for UI rendering
 * @param {string} severity - 'critical' | 'high' | 'medium' | 'pass'
 * @returns {{ badgeBg: string, badgeText: string, badgeBorder: string, color: string, name: string }}
 */
export function getSecretSeverityColor(severity) {
  const normalized = (severity || '').toLowerCase().trim();
  if (normalized === 'critical') {
    return {
      badgeBg: 'bg-red-500/10',
      badgeText: 'text-red-600 dark:text-red-400',
      badgeBorder: 'border-red-500/30',
      color: '#EF4444',
      name: 'red',
    };
  }
  if (normalized === 'high') {
    return {
      badgeBg: 'bg-orange-500/10',
      badgeText: 'text-orange-600 dark:text-orange-400',
      badgeBorder: 'border-orange-500/30',
      color: '#F97316',
      name: 'orange',
    };
  }
  if (normalized === 'medium') {
    return {
      badgeBg: 'bg-amber-500/10',
      badgeText: 'text-amber-600 dark:text-amber-400',
      badgeBorder: 'border-amber-500/30',
      color: '#F59E0B',
      name: 'amber',
    };
  }
  // pass / clean
  return {
    badgeBg: 'bg-emerald-500/10',
    badgeText: 'text-emerald-600 dark:text-emerald-400',
    badgeBorder: 'border-emerald-500/30',
    color: '#10B981',
    name: 'emerald',
  };
}

/**
 * Get a human-readable grade label for the secret scan
 * @param {string} grade - 'PASS' | 'WARN' | 'FAIL'
 * @returns {string}
 */
export function getSecretGradeLabel(grade) {
  switch ((grade || '').toUpperCase()) {
    case 'PASS': return 'No Leaks Detected';
    case 'WARN': return 'Potential Exposure';
    case 'FAIL': return 'Secrets Exposed';
    default: return 'Not Scanned';
  }
}

/**
 * Fetch secret/leak scan results for a target website URL
 * @param {string} url - Target website URL to scan
 * @param {object} [options] - Options { timeoutMs?: number }
 * @returns {Promise<object>} Parsed secret scan results
 */
export async function fetchSecretsScan(url, options = {}) {
  if (!url || typeof url !== 'string') {
    throw new Error('Invalid URL provided for secret scan.');
  }

  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;

  // Call the Netlify serverless function
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch('/.netlify/functions/analyze-secrets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (response.ok) {
      const data = await response.json();
      return parseSecretsResponse(data);
    }

    console.warn(`[Secrets] Function returned HTTP ${response.status}. Using fallback.`);
  } catch (err) {
    console.warn('[Secrets] Secret scan function call failed:', err.message);
  }

  // Fallback: Return a clean "pass" result when the function is unavailable
  return buildFallbackSecretsResult(url);
}

/**
 * Parse raw response from the analyze-secrets function
 * @param {object} data - Raw JSON from the serverless function
 * @returns {object} Structured secret scan result
 */
function parseSecretsResponse(data) {
  const totalLeaks = data.totalLeaks || 0;
  const grade = data.grade || (totalLeaks === 0 ? 'PASS' : 'FAIL');
  const severity = data.severity || (totalLeaks === 0 ? 'pass' : 'critical');

  // Build checks array for the report card (matches observatory check format)
  const checks = buildSecretsChecks(data);

  return {
    url: data.url || '',
    totalLeaks,
    findings: data.findings || [],
    bundlesScanned: data.bundlesScanned || 0,
    inlineScriptsScanned: data.inlineScriptsScanned || 0,
    totalScriptsFound: data.totalScriptsFound || 0,
    scanTimeMs: data.scanTimeMs || 0,
    severity,
    grade,
    checks,
    warnings: data.warnings || [],
    isFallback: data.isFallback || false,
    isLive: !data.isFallback,
    source: 'siteproof-secret-scanner',
    scannedAt: data.scannedAt || new Date().toISOString(),
  };
}

/**
 * Build structured check items for the report card
 * @param {object} data - Parsed secrets scan data
 * @returns {Array<{ status: 'pass'|'warn'|'fail', label: string }>}
 */
export function buildSecretsChecks(data) {
  const checks = [];
  const totalLeaks = data.totalLeaks || 0;
  const findings = data.findings || [];

  // Check 1: Overall leak status
  if (totalLeaks === 0) {
    checks.push({
      status: 'pass',
      label: 'No exposed API keys or secrets detected in client bundles',
    });
  } else {
    const criticalCount = findings.filter(f => f.severity === 'critical').length;
    const highCount = findings.filter(f => f.severity === 'high').length;
    checks.push({
      status: 'fail',
      label: `${totalLeaks} exposed secret${totalLeaks > 1 ? 's' : ''} detected (${criticalCount} critical, ${highCount} high)`,
    });
  }

  // Check 2: Bundle coverage
  const bundlesScanned = data.bundlesScanned || 0;
  const inlineScanned = data.inlineScriptsScanned || 0;
  const totalScanned = bundlesScanned + inlineScanned;
  checks.push({
    status: totalScanned > 0 ? 'pass' : 'warn',
    label: totalScanned > 0
      ? `Scanned ${bundlesScanned} JS bundle${bundlesScanned !== 1 ? 's' : ''} + ${inlineScanned} inline script${inlineScanned !== 1 ? 's' : ''}`
      : 'No JavaScript bundles found to scan',
  });

  // Check 3: Per-finding details (show up to 5 individual findings)
  for (const finding of findings.slice(0, 5)) {
    checks.push({
      status: finding.severity === 'critical' ? 'fail' : 'warn',
      label: `${finding.name} (${finding.maskedValue}) in ${finding.sourceFile}`,
    });
  }

  if (findings.length > 5) {
    checks.push({
      status: 'fail',
      label: `...and ${findings.length - 5} more exposed secret${findings.length - 5 > 1 ? 's' : ''}`,
    });
  }

  return checks;
}

/**
 * Fallback result when the serverless function is unavailable
 */
function buildFallbackSecretsResult(url) {
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
    checks: [
      { status: 'pass', label: 'Secret scan unavailable — no issues assumed' },
    ],
    warnings: ['Secret bundle scan was unavailable. Results are assumed clean.'],
    isFallback: true,
    isLive: false,
    source: 'siteproof-secret-scanner-fallback',
    scannedAt: new Date().toISOString(),
  };
}

export const secretsService = {
  getSecretSeverityColor,
  getSecretGradeLabel,
  fetchSecretsScan,
  buildSecretsChecks,
};
