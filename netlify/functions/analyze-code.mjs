/**
 * Netlify Serverless Function: /.netlify/functions/analyze-code
 *
 * Handles GitHub source code extraction + NVIDIA NIM AI audit for Code Quality exclusively.
 */

const NVIDIA_API_BASE = 'https://integrate.api.nvidia.com/v1';
const GITHUB_API = 'https://api.github.com';

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
    const { githubRepoUrl, url } = JSON.parse(event.body || '{}');

    if (!githubRepoUrl) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(buildCodeQualityFallbackReport(null, url, 'No GitHub repository provided.')),
      };
    }

    const warnings = [];
    let githubData = null;
    try {
      githubData = await extractGithubCode(githubRepoUrl);
    } catch (err) {
      console.warn('[Analyze-Code] GitHub extraction failed:', err.message);
      warnings.push(`Could not extract GitHub code (${err.message}). Code Quality analysis used fallback.`);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(buildCodeQualityFallbackReport(githubRepoUrl, url, err.message, warnings)),
      };
    }

    let codeReport;
    try {
      codeReport = await callNvidiaCodeAI(githubData, githubRepoUrl, url);
    } catch (err) {
      console.error('[Analyze-Code] NVIDIA AI code review failed:', err.message);
      codeReport = buildCodeQualityFallbackReport(githubRepoUrl, url, 'AI analysis unavailable');
      warnings.push('AI code review unavailable — fallback Code Quality module applied.');
    }

    codeReport.warnings = warnings;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(codeReport),
    };
  } catch (err) {
    console.error('[Analyze-Code] Unexpected error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', message: err.message }),
    };
  }
};

// ================================================================
// GITHUB EXTRACTION
// ================================================================

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
        throw new Error(`GitHub API rate limited (remaining: ${remaining}).`);
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
// NVIDIA NIM AI CODE REVIEW
// ================================================================

async function callNvidiaCodeAI(githubData, githubRepoUrl, url) {
  const apiKey = process.env.NVIDIA_API_KEY;
  const model = process.env.NVIDIA_MODEL || 'nvidia/nemotron-3-ultra-550b-a55b';

  if (!apiKey) {
    console.warn('[NVIDIA-Code] No API key configured');
    return buildCodeQualityFallbackReport(githubRepoUrl, url, 'No API key configured.');
  }

  const prompt = buildCodePrompt(githubData, githubRepoUrl, url);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 18000); // 18s timeout

  let response;
  try {
    response = await fetch(`${NVIDIA_API_BASE}/chat/completions`, {
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
            content: `You are SiteProof AI, an expert code reviewer. You analyze GitHub source code exclusively for Code Quality, Architecture, Security, and Code Best Practices.

You MUST respond with ONLY valid JSON. No markdown, no code fences, no explanations outside the JSON. Your response must parse with JSON.parse().`,
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 2500,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn('[NVIDIA-Code] AI code request failed or timed out:', err.message);
    return buildCodeQualityFallbackReport(githubRepoUrl, url, err.message);
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    console.error(`[NVIDIA-Code] API error ${response.status}:`, errText.slice(0, 500));
    return buildCodeQualityFallbackReport(githubRepoUrl, url, `NVIDIA API error ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    return buildCodeQualityFallbackReport(githubRepoUrl, url, 'Empty response from AI.');
  }

  const parsed = extractJSON(content);
  if (!parsed) {
    return buildCodeQualityFallbackReport(githubRepoUrl, url, 'Could not parse JSON response from AI.');
  }

  return normalizeCodeAIResponse(parsed, githubRepoUrl, url, model);
}

function buildCodePrompt(githubData, githubRepoUrl, url) {
  const domain = extractDomain(url);
  const repoName = githubRepoUrl ? githubRepoUrl.replace('https://github.com/', '') : 'Repository';

  let prompt = `Analyze the source code of GitHub repository "${repoName}" for website ${domain}.\n\n`;
  prompt += `## GITHUB SOURCE CODE DATA\n${githubData.summary || ''}\n\n### Key Source Files:\n`;

  let charBudget = 75000;
  for (const file of (githubData.files || [])) {
    if (charBudget <= 0) break;
    const truncated = file.content.slice(0, Math.min(file.content.length, charBudget));
    prompt += `\n--- FILE: ${file.path} ---\n${truncated}\n`;
    charBudget -= truncated.length;
  }

  prompt += `\n
## YOUR TASK
Produce a JSON object containing the Code Quality module analysis and fix prompts.

{
  "summary": "<1-2 sentence summary of repository code quality>",
  "auditBreakdown": [
    {
      "id": "code-quality",
      "category": "Code Quality",
      "title": "Code Quality & Architecture",
      "score": <score 0.0 to 10.0 based on real code quality>,
      "description": "<1-2 sentence overview referencing exact files and code patterns>",
      "source": "github-code-review",
      "checks": [
        { "status": "<pass|fail|warn>", "label": "<specific check citing exact file path or code pattern>" }
      ]
    }
  ],
  "fixPrompts": [
    {
      "priority": "<CRITICAL|HIGH|MEDIUM|LOW>",
      "time": "<e.g. '15 mins'>",
      "title": "<short action title>",
      "detail": "<why this matters, citing exact file paths>",
      "impact": "<e.g. 'Est. +5 pts'>",
      "prompt": "<Direct instruction prompt for Cursor/Bolt/v0 referencing exact file paths with mandatory build and deployment steps>",
      "code": "<example code snippet showing the fix>"
    }
  ]
}

⚠️ FIX PROMPT RULE: Every prompt in fixPrompts MUST instruct the AI assistant to fix the code, test/build, and automatically deploy the changes to production (e.g. Netlify/Vercel) if permissions allow, or remind the user to deploy/publish their changes before rescanning in SiteProof.

Respond with ONLY valid JSON. No other text.`;

  return prompt;
}

function normalizeCodeAIResponse(aiData, githubRepoUrl, url, model = '') {
  const breakdownRaw = Array.isArray(aiData.auditBreakdown) ? aiData.auditBreakdown[0] : aiData;
  const scoreNum = breakdownRaw?.score ? parseFloat(breakdownRaw.score) : 7.5;
  const clampedScore = Math.max(0, Math.min(10, scoreNum)).toFixed(1);

  const checks = (breakdownRaw?.checks || []).slice(0, 5).map((c) => ({
    status: ['pass', 'fail', 'warn'].includes(c.status) ? c.status : 'warn',
    label: c.label || c.title || 'Code pattern verified',
  }));

  const codeQualityModule = {
    id: 'code-quality',
    category: 'Code Quality',
    title: breakdownRaw?.title || 'Code Quality & Architecture',
    score: clampedScore,
    description: breakdownRaw?.description || `Source code review of ${githubRepoUrl.replace('https://github.com/', '')} complete.`,
    source: 'github-code-review',
    checks: checks.length > 0 ? checks : [
      { status: 'pass', label: 'Repository structure and dependency manifest inspected' },
      { status: 'pass', label: 'Source code modularity verified' },
    ],
  };

  const domain = extractDomain(url);
  const fixPrompts = (aiData.fixPrompts || []).map((p) => ({
    priority: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(p.priority) ? p.priority : 'MEDIUM',
    time: p.time || '15 mins',
    title: p.title || 'Improve Code Architecture',
    detail: p.detail || 'Code review recommendation based on source code analysis.',
    impact: p.impact || '+5 pts',
    prompt: p.prompt || `You are an AI Coding Assistant. Implement the following fix for the website ${domain} (Repository: ${githubRepoUrl}) automatically.\n\nIssue to Fix: ${p.title}\nDetails: ${p.detail || 'Refactor codebase to improve code quality.'}\n\nExecution Instructions:\n1. Inspect the repository, identify the exact file paths and code causing this issue, and apply the required changes directly.\n2. Build and verify the project (e.g., npm run build, run tests) to ensure zero errors.\n3. Deployment & CI/CD:\n   - If you have access to deployment tools or hosting integrations (e.g. Netlify, Vercel, Git CI/CD), build and deploy the updated project to live production.\n   - If you cannot deploy automatically, remind the user: "⚠️ DEPLOYMENT REQUIRED: To see your improved score when rescanning in SiteProof, please deploy or publish these changes to your live website host before rescanning."`,
    code: p.code || '',
  }));

  return {
    summary: aiData.summary || `Code quality analysis complete for ${githubRepoUrl}.`,
    auditBreakdown: [codeQualityModule],
    fixPrompts,
    source: 'nvidia-ai-code',
    model,
  };
}

function buildCodeQualityFallbackReport(githubRepoUrl, url, errorMsg = '', warnings = []) {
  const repoName = githubRepoUrl ? githubRepoUrl.replace('https://github.com/', '') : 'Repository';
  const description = githubRepoUrl
    ? `GitHub repository (${repoName}) was linked, but code analysis was unavailable (${errorMsg}).`
    : 'No source code review was available. Link a GitHub repository for code quality checks.';

  return {
    summary: `Code quality review fallback applied for ${repoName}.`,
    auditBreakdown: [
      {
        id: 'code-quality',
        category: 'Code Quality',
        title: 'Code Quality',
        score: '0.0',
        description,
        source: 'github-code-review',
        checks: [
          { status: 'warn', label: 'GitHub code extraction or AI code analysis timed out' },
        ],
      },
    ],
    fixPrompts: [],
    warnings,
    source: 'code-fallback',
  };
}

function extractJSON(text) {
  if (!text || typeof text !== 'string') return null;
  try { return JSON.parse(text.trim()); } catch {}
  try {
    const stripped = text.replace(/^[\s\S]*?```(?:json|JSON)?\s*\n?/, '').replace(/\n?\s*```[\s\S]*$/, '').trim();
    if (stripped.startsWith('{') || stripped.startsWith('[')) return JSON.parse(stripped);
  } catch {}
  try {
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) return JSON.parse(text.slice(firstBrace, lastBrace + 1));
  } catch {}
  return null;
}

function extractDomain(url) {
  try { return new URL(url).hostname; } catch { return url.replace(/^https?:\/\//, '').replace(/\/.*$/, ''); }
}
