/**
 * Netlify Serverless Function: /api/analyze
 *
 * SECURE server-side function that handles:
 *   1. GitHub source code extraction (with GITHUB_TOKEN for 5,000 req/hr)
 *   2. NVIDIA NIM AI analysis (API key never exposed to browser)
 *
 * The frontend sends PageSpeed scan results + optional GitHub repo URL,
 * and this function returns the AI-generated audit report.
 *
 * Environment variables (set in Netlify dashboard, NOT in VITE_):
 *   - NVIDIA_API_KEY (required)
 *   - NVIDIA_MODEL (optional, defaults to nvidia/nemotron-3-ultra-550b-a55b)
 *   - GITHUB_TOKEN (optional but recommended for 5,000 req/hr vs 60)
 */

// ================================================================
// HANDLER
// ================================================================

export const handler = async (event) => {
  // CORS headers for the frontend
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { pageSpeedData, githubRepoUrl, url } = JSON.parse(event.body || '{}');

    if (!pageSpeedData || !url) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields: pageSpeedData, url' }),
      };
    }

    // --- Step 1: Extract GitHub code (server-side, with token) ---
    let githubData = null;
    const warnings = [];
    if (githubRepoUrl) {
      try {
        githubData = await extractGithubCode(githubRepoUrl);
      } catch (err) {
        console.warn('[Function] GitHub extraction failed (non-fatal):', err.message);
        warnings.push(`Could not access GitHub repository (${err.message}). Code Quality analysis was skipped — the rest of the report uses real PageSpeed data.`);
        // Continue without GitHub data — it's optional
      }
    }

    // --- Step 2: Call NVIDIA NIM AI (server-side, key is secure) ---
    let aiReport;
    try {
      aiReport = await callNvidiaAI(pageSpeedData, githubData, url);
    } catch (err) {
      console.error('[Function] NVIDIA AI failed:', err.message);
      aiReport = buildFallbackReport(pageSpeedData, url);
      warnings.push('AI deep analysis was unavailable — report uses Google PageSpeed data only.');
    }

    // Attach warnings to the response
    aiReport.warnings = warnings;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(aiReport),
    };
  } catch (err) {
    console.error('[Function] Unexpected error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', message: err.message }),
    };
  }
};

// ================================================================
// GITHUB CODE EXTRACTION (server-side, uses GITHUB_TOKEN)
// ================================================================

const GITHUB_API = 'https://api.github.com';

const INCLUDE_EXTENSIONS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
  '.css', '.scss', '.less',
  '.html', '.htm',
  '.json', '.yaml', '.yml',
  '.md', '.env.example',
]);

const EXCLUDE_PATTERNS = [
  'node_modules/', 'dist/', 'build/', '.next/', '.nuxt/',
  'coverage/', '.git/', '__pycache__/', 'vendor/', '.cache/',
  '.vercel/', '.netlify/', 'package-lock.json', 'yarn.lock',
  'pnpm-lock.yaml', 'bun.lockb',
  'public/', 'components/ui/', 'assets/', 'images/'
];

const MAX_FILE_SIZE = 50000;
const MAX_TOTAL_SIZE = 500000;
const MAX_FILES = 40;

function parseGithubUrl(input) {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  const urlMatch = trimmed.match(
    /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)/
  );
  if (urlMatch) return { owner: urlMatch[1], repo: urlMatch[2].replace(/\.git$/, '') };

  const shortMatch = trimmed.match(/^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/);
  if (shortMatch) return { owner: shortMatch[1], repo: shortMatch[2] };

  return null;
}

function getGithubHeaders() {
  const token = process.env.GITHUB_TOKEN;
  const h = { Accept: 'application/vnd.github.v3+json', 'User-Agent': 'SiteProof-Scanner' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function fetchRepoTree(owner, repo) {
  const headers = getGithubHeaders();

  for (const branch of ['main', 'master']) {
    try {
      const res = await fetch(
        `${GITHUB_API}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
        { headers }
      );
      if (res.ok) {
        const data = await res.json();
        return { tree: data.tree || [], branch };
      }
      if (res.status === 403) {
        const remaining = res.headers.get('x-ratelimit-remaining');
        throw new Error(`GitHub API rate limited (remaining: ${remaining}). Add a GITHUB_TOKEN.`);
      }
      if (res.status === 404) continue;
      throw new Error(`GitHub API error: ${res.status}`);
    } catch (err) {
      if (branch === 'master') throw err;
    }
  }
  throw new Error(`Could not find branch 'main' or 'master' for ${owner}/${repo}`);
}

function filterRelevantFiles(tree) {
  return tree
    .filter((item) => {
      if (item.type !== 'blob') return false;
      const path = item.path.toLowerCase();
      if (EXCLUDE_PATTERNS.some((p) => path.includes(p.toLowerCase()))) return false;
      if (item.size && item.size > MAX_FILE_SIZE) return false;

      const ext = '.' + path.split('.').pop();
      if (INCLUDE_EXTENSIONS.has(ext)) return true;

      const basename = path.split('/').pop().toLowerCase();
      if (['package.json', 'tsconfig.json', 'vite.config.js', 'vite.config.ts',
           'next.config.js', 'next.config.mjs', '.env.example', 'readme.md',
           'dockerfile', 'docker-compose.yml'].includes(basename)) return true;

      return false;
    })
    .sort((a, b) => {
      const priority = (p) => {
        const l = p.toLowerCase();
        if (l === 'package.json') return 0;
        if (l === 'readme.md') return 1;
        if (l.includes('vite.config') || l.includes('next.config')) return 2;
        if (l.startsWith('src/') || l.startsWith('app/')) {
          if (l.includes('app.') || l.includes('index.')) return 3;
          if (l.includes('route') || l.includes('api/')) return 4;
          return 5;
        }
        if (l.includes('config')) return 6;
        return 7;
      };
      return priority(a.path) - priority(b.path);
    })
    .slice(0, MAX_FILES);
}

async function fetchFileContents(owner, repo, files, branch) {
  const headers = getGithubHeaders();
  const results = [];
  let totalSize = 0;

  // Fetch files in batches of 10 to stay efficient
  const BATCH_SIZE = 10;
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    if (totalSize >= MAX_TOTAL_SIZE) break;

    const batch = files.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (file) => {
      try {
        const res = await fetch(
          `${GITHUB_API}/repos/${owner}/${repo}/contents/${file.path}?ref=${branch}`,
          { headers }
        );
        if (!res.ok) return null;
        const data = await res.json();
        if (data.content && data.encoding === 'base64') {
          const content = Buffer.from(data.content, 'base64').toString('utf-8');
          return { path: file.path, content, size: content.length };
        }
        return null;
      } catch {
        return null;
      }
    });

    const batchResults = await Promise.all(promises);
    for (const result of batchResults) {
      if (!result) continue;
      if (totalSize + result.size > MAX_TOTAL_SIZE) break;
      results.push(result);
      totalSize += result.size;
    }
  }

  return results;
}

async function extractGithubCode(repoUrl) {
  const parsed = parseGithubUrl(repoUrl);
  if (!parsed) throw new Error('Invalid GitHub repository URL');

  const { owner, repo } = parsed;
  const { tree, branch } = await fetchRepoTree(owner, repo);
  const relevantFiles = filterRelevantFiles(tree);

  if (relevantFiles.length === 0) {
    return {
      files: [],
      summary: `Repository ${owner}/${repo} has no analyzable source files.`,
      fileTree: tree.map((t) => t.path),
    };
  }

  const files = await fetchFileContents(owner, repo, relevantFiles, branch);
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  return {
    files,
    summary: `Extracted ${files.length} source files (${(totalSize / 1024).toFixed(1)}KB) from ${owner}/${repo} (${branch} branch).`,
    fileTree: tree.filter((t) => t.type === 'blob').map((t) => t.path),
    repoInfo: { owner, repo, branch },
  };
}

// ================================================================
// NVIDIA NIM AI CALL (server-side, key is secure)
// ================================================================

const NVIDIA_API_BASE = 'https://integrate.api.nvidia.com/v1';

async function callNvidiaAI(pageSpeedData, githubData, url) {
  const apiKey = process.env.NVIDIA_API_KEY;
  const model = process.env.NVIDIA_MODEL || 'nvidia/nemotron-3-ultra-550b-a55b';

  if (!apiKey) {
    console.warn('[NVIDIA] No API key configured (set NVIDIA_API_KEY in Netlify env vars)');
    return buildFallbackReport(pageSpeedData, url);
  }

  const prompt = buildAnalysisPrompt(pageSpeedData, githubData, url);

  const response = await fetch(`${NVIDIA_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: `You are SiteProof AI, an expert web quality auditor. You analyze websites across 13 audit modules: Security, Performance, SEO, Accessibility, Best Practices, UI/UX, Mobile Responsiveness, Content Quality, Legal Compliance, Technical Health, Business & Conversion, Code Quality, and Infrastructure.

You MUST respond with ONLY valid JSON. No markdown, no code fences, no explanations outside the JSON. Your response must parse with JSON.parse().`,
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    console.error(`[NVIDIA] API error ${response.status}:`, errText.slice(0, 500));

    if (response.status === 401) throw new Error('Invalid NVIDIA API key.');
    if (response.status === 429) throw new Error('NVIDIA API rate limited. Try again later.');

    return buildFallbackReport(pageSpeedData, url);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    console.warn('[NVIDIA] Empty response');
    return buildFallbackReport(pageSpeedData, url);
  }

  // --- ROBUST JSON EXTRACTION (Fix #3) ---
  const parsed = extractJSON(content);
  if (!parsed) {
    console.warn('[NVIDIA] All JSON parse strategies failed. Raw content:', content.slice(0, 300));
    return buildFallbackReport(pageSpeedData, url);
  }

  return normalizeAIResponse(parsed, pageSpeedData, url);
}

/**
 * ROBUST JSON EXTRACTOR — handles all LLM output formats:
 *   1. Clean JSON (direct parse)
 *   2. Markdown-wrapped (```json ... ```)
 *   3. JSON buried in text (find { ... } boundaries)
 */
function extractJSON(text) {
  if (!text || typeof text !== 'string') return null;

  // Strategy 1: Direct parse (cleanest case)
  try {
    return JSON.parse(text.trim());
  } catch { /* continue */ }

  // Strategy 2: Strip markdown code fences (most common LLM wrapping)
  try {
    const stripped = text
      .replace(/^[\s\S]*?```(?:json|JSON)?\s*\n?/, '')  // everything before opening fence
      .replace(/\n?\s*```[\s\S]*$/, '')                   // everything after closing fence
      .trim();
    if (stripped.startsWith('{') || stripped.startsWith('[')) {
      return JSON.parse(stripped);
    }
  } catch { /* continue */ }

  // Strategy 3: Find the outermost JSON object by brace matching
  try {
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(text.slice(firstBrace, lastBrace + 1));
    }
  } catch { /* continue */ }

  // Strategy 4: Try finding a JSON array
  try {
    const firstBracket = text.indexOf('[');
    const lastBracket = text.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket > firstBracket) {
      return JSON.parse(text.slice(firstBracket, lastBracket + 1));
    }
  } catch { /* continue */ }

  return null; // All strategies failed
}

// ================================================================
// PROMPT BUILDER
// ================================================================

function buildAnalysisPrompt(pageSpeedData, githubData, url) {
  const domain = extractDomain(url);
  const hasGithubCode = githubData && githubData.files && githubData.files.length > 0;

  // ALWAYS 6 categories — consistent structure for AI stability
  const categories = ['Performance', 'SEO', 'Security', 'Accessibility', 'Best Practices', 'Code Quality'];

  let prompt = `Analyze the website "${url}" (${domain}) using ONLY the real scan data provided below.

## LIVE URL SCAN DATA (from Google PageSpeed Insights)

### Category Scores (0-100)
- Performance: ${pageSpeedData.scores?.performance ?? 'N/A'}
- SEO: ${pageSpeedData.scores?.seo ?? 'N/A'}
- Accessibility: ${pageSpeedData.scores?.accessibility ?? 'N/A'}
- Best Practices: ${pageSpeedData.scores?.bestPractices ?? 'N/A'}
- Security (derived): ${pageSpeedData.scores?.security ?? 'N/A'}

### Core Web Vitals
- LCP: ${pageSpeedData.webVitals?.lcp ? pageSpeedData.webVitals.lcp + 'ms' : 'N/A'}
- FID: ${pageSpeedData.webVitals?.fid ? pageSpeedData.webVitals.fid + 'ms' : 'N/A'}
- CLS: ${pageSpeedData.webVitals?.cls ?? 'N/A'}
- FCP: ${pageSpeedData.webVitals?.fcp ? pageSpeedData.webVitals.fcp + 'ms' : 'N/A'}
- INP: ${pageSpeedData.webVitals?.inp ? pageSpeedData.webVitals.inp + 'ms' : 'N/A'}
- TTFB: ${pageSpeedData.webVitals?.ttfb ? pageSpeedData.webVitals.ttfb + 'ms' : 'N/A'}

### Detected Technology Stack
${(pageSpeedData.techStack || []).join(', ') || 'Unknown'}

### Failed/Warning Audits (${pageSpeedData.issues?.length || 0} issues found)
${formatIssuesForPrompt(pageSpeedData.issues || [])}
`;

  if (hasGithubCode) {
    prompt += `\n## SOURCE CODE FROM GITHUB REPOSITORY
${githubData.summary || ''}

### Key Source Files:
`;
    let charBudget = 80000;
    for (const file of githubData.files) {
      if (charBudget <= 0) break;
      const truncated = file.content.slice(0, Math.min(file.content.length, charBudget));
      prompt += `\n--- FILE: ${file.path} ---\n${truncated}\n`;
      charBudget -= truncated.length;
    }
  } else {
    prompt += `\n## SOURCE CODE\nNo GitHub repository was provided. Analyze based on the URL scan data only.\n`;
  }

  prompt += `
## YOUR TASK
Produce a JSON object with this exact structure.

⚠️ CRITICAL RULES — FOLLOW EXACTLY:
1. ALWAYS produce exactly 6 auditBreakdown entries, one for each category: ${categories.join(', ')}.
2. DO NOT invent, fabricate, or guess data for categories without real measurements (e.g., do NOT generate UI/UX, Mobile, Content, Legal, Technical Health, Business, or Infrastructure modules).
3. Every check label MUST reference a specific metric, file path, element, or audit result from the scan data above. If you cannot cite real data, do not include the check.
4. The "source" field on each auditBreakdown entry must be "google-pagespeed" for the 5 PageSpeed categories, or "github-code-review" for Code Quality.
5. If NO GitHub source code was provided above, still include the Code Quality entry but set score to 0, description to "No source code was provided for review. Link a GitHub repository to enable code quality analysis.", and leave checks as an empty array [].

{
  "healthScore": <number 0-100>,
  "summary": "<2-3 sentence executive summary referencing actual scores>",
  "verdict": "<one of: 'Production Ready', 'Needs Minor Fixes', 'Needs Work Before Launch', 'Critical Issues Found'>",
  "projectedScore": <number 0-100, score after implementing your fixes>,
  "auditBreakdown": [
    {
      "id": "<unique slug>",
      "category": "<${categories.join('|')}>",
      "title": "<module title>",
      "score": <number 0.0 to 10.0>,
      "description": "<1-2 sentence finding citing specific data from the scan above>",
      "source": "<google-pagespeed|github-code-review>",
      "checks": [
        { "status": "<pass|fail|warn>", "label": "<specific check detail citing real metrics, file paths, or element selectors from the data above>" }
      ]
    }
  ],
  "fixPrompts": [
    {
      "priority": "<CRITICAL|HIGH|MEDIUM|LOW>",
      "time": "<estimated fix time, e.g. '15 mins'>",
      "title": "<short action title>",
      "detail": "<why this matters, citing real data>",
      "impact": "<e.g. '+8 pts'>",
      "prompt": "<THE EXACT PROMPT the user should paste into Cursor/v0/Bolt.new/Lovable to fix this issue. Be specific: mention file paths, class names, elements, and exact changes needed. ONLY reference issues that appear in the scan data above.>",
      "code": "<a brief example code snippet showing the fix>"
    }
  ],
  "techStack": ["<technology 1>", "<technology 2>"],
  "stats": {
    "passedChecks": <number>,
    "failedChecks": <number>,
    "warningChecks": <number>,
    "criticalIssues": <number>
  }
}

ADDITIONAL RULES:
- healthScore must be a realistic weighted average of the ${categories.length} modules above
- Each auditBreakdown entry must have 2-5 specific checks with real data from the scan
- fixPrompts must contain REAL, ACTIONABLE prompts that reference actual issues found in the data
- Sort fixPrompts by priority: CRITICAL first, then HIGH, MEDIUM, LOW
- Include 3-5 fix prompts
- Be brutally honest about issues — do not inflate scores
- NEVER include modules for categories not listed above

Respond with ONLY the JSON object. No other text.`;

  return prompt;
}

function formatIssuesForPrompt(issues) {
  if (issues.length === 0) return 'No issues detected.';
  return issues
    .slice(0, 20)
    .map((i) => `- [${i.severity.toUpperCase()}] ${i.title}${i.displayValue ? ` (${i.displayValue})` : ''} — ${i.category}`)
    .join('\n');
}

// ================================================================
// RESPONSE NORMALIZERS & FALLBACK
// ================================================================

// Allowed categories — only those backed by real data
const VALID_CATEGORIES = new Set([
  'performance', 'seo', 'security', 'accessibility', 'best practices', 'best-practices',
  'bestpractices', 'code quality', 'code-quality', 'codequality',
]);

function normalizeAIResponse(aiData, pageSpeedData, url) {
  // Filter out any hallucinated categories that don't have real backing data
  const filteredBreakdown = (aiData.auditBreakdown || []).filter((item) => {
    const cat = (item.category || '').toLowerCase().replace(/\s+/g, '-');
    return VALID_CATEGORIES.has(cat) || VALID_CATEGORIES.has(cat.replace(/-/g, ''));
  });

  return {
    healthScore: clamp(aiData.healthScore ?? pageSpeedData.overallScore ?? 50, 0, 100),
    summary: aiData.summary || pageSpeedData.summary || `Analysis of ${extractDomain(url)} complete.`,
    verdict: aiData.verdict || deriveVerdict(aiData.healthScore ?? 50),
    projectedScore: clamp(aiData.projectedScore ?? Math.min((aiData.healthScore ?? 50) + 17, 98), 0, 100),
    auditBreakdown: filteredBreakdown.map((item) => ({
      id: item.id || item.category?.toLowerCase().replace(/\s+/g, '-') || 'unknown',
      category: item.category || 'General',
      title: item.title || item.category || 'Audit Module',
      score: typeof item.score === 'number' ? item.score.toFixed(1) : '5.0',
      description: item.description || '',
      source: item.source || 'google-pagespeed',
      checks: (item.checks || []).map((c) => ({
        status: ['pass', 'fail', 'warn'].includes(c.status) ? c.status : 'warn',
        label: c.label || 'Check',
      })),
    })),
    fixPrompts: (aiData.fixPrompts || []).map((p) => ({
      priority: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(p.priority) ? p.priority : 'MEDIUM',
      time: p.time || '10 mins',
      title: p.title || 'Fix Issue',
      detail: p.detail || '',
      impact: p.impact || '+5 pts',
      prompt: p.prompt || '',
      code: p.code || '',
    })),
    techStack: aiData.techStack || pageSpeedData.techStack || [],
    stats: aiData.stats || { passedChecks: 0, failedChecks: 0, warningChecks: 0, criticalIssues: 0 },
    source: 'nvidia-ai',
  };
}

function buildFallbackReport(pageSpeedData, url) {
  const domain = extractDomain(url);
  const scores = pageSpeedData.scores || {};
  const overall = pageSpeedData.overallScore || 50;
  const issues = pageSpeedData.issues || [];
  const modules = pageSpeedData.modules || [];

  const auditBreakdown = modules.map((m) => ({
    id: m.id,
    category: m.title || m.id,
    title: m.title,
    score: m.score,
    description: m.description,
    source: 'google-pagespeed',
    checks: m.checks || [],
  }));

  if (auditBreakdown.length === 0) {
    const defaults = [
      { id: 'security', title: 'Security Analysis', key: 'security' },
      { id: 'performance', title: 'Performance Analysis', key: 'performance' },
      { id: 'seo', title: 'SEO Analysis', key: 'seo' },
      { id: 'accessibility', title: 'Accessibility Analysis', key: 'accessibility' },
      { id: 'bestPractices', title: 'Best Practices', key: 'bestPractices' },
    ];
    for (const d of defaults) {
      const score = scores[d.key] ?? 50;
      const modIssues = issues.filter((i) => i.category === d.id);
      auditBreakdown.push({
        id: d.id, category: d.title, title: d.title,
        score: (score / 10).toFixed(1),
        description: modIssues.length > 0 ? `Found ${modIssues.length} issues.` : `Score: ${score}/100`,
        source: 'google-pagespeed',
        checks: modIssues.slice(0, 5).map((i) => ({
          status: i.severity === 'critical' || i.severity === 'high' ? 'fail' : i.severity === 'medium' ? 'warn' : 'pass',
          label: `${i.title}${i.displayValue ? ` (${i.displayValue})` : ''}`,
        })),
      });
    }
  }

  const recs = pageSpeedData.recommendations || [];
  const fixPrompts = recs.map((rec) => ({
    priority: rec.priority || 'MEDIUM',
    time: rec.time || '10 mins',
    title: rec.title || 'Fix Issue',
    detail: rec.detail || '',
    impact: rec.impact || '+5 pts',
    prompt: `Act as an expert web developer. My website ${domain} needs: ${rec.title}. ${rec.detail}. Please provide exact code fixes.`,
    code: '',
  }));

  if (fixPrompts.length < 3) {
    for (const issue of issues.filter((i) => i.severity === 'critical' || i.severity === 'high').slice(0, 5 - fixPrompts.length)) {
      fixPrompts.push({
        priority: issue.severity === 'critical' ? 'CRITICAL' : 'HIGH',
        time: '15 mins', title: issue.title, detail: issue.description,
        impact: '+5 pts',
        prompt: `Act as an expert web developer. My website ${domain} has: ${issue.title} (${issue.category}, ${issue.severity}). ${issue.description}. ${issue.displayValue || ''}. Provide exact code fix.`,
        code: '',
      });
    }
  }

  const passedChecks = auditBreakdown.reduce((s, m) => s + (m.checks || []).filter((c) => c.status === 'pass').length, 0);
  const failedChecks = auditBreakdown.reduce((s, m) => s + (m.checks || []).filter((c) => c.status === 'fail').length, 0);
  const warningChecks = auditBreakdown.reduce((s, m) => s + (m.checks || []).filter((c) => c.status === 'warn').length, 0);

  return {
    healthScore: overall,
    summary: pageSpeedData.summary || `Analysis of ${domain} complete. Score: ${overall}/100.`,
    verdict: deriveVerdict(overall),
    projectedScore: Math.min(overall + 17, 98),
    auditBreakdown, fixPrompts,
    techStack: pageSpeedData.techStack || ['Standard Web'],
    stats: { passedChecks, failedChecks, warningChecks, criticalIssues: issues.filter((i) => i.severity === 'critical').length },
    source: 'pagespeed-fallback',
  };
}

// ================================================================
// UTILITIES
// ================================================================

function deriveVerdict(score) {
  if (score >= 90) return 'Production Ready';
  if (score >= 75) return 'Needs Minor Fixes';
  if (score >= 50) return 'Needs Work Before Launch';
  return 'Critical Issues Found';
}

function extractDomain(url) {
  try { return new URL(url).hostname; } catch { return url.replace(/^https?:\/\//, '').replace(/\/.*$/, ''); }
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}
