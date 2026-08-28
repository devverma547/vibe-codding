/**
 * Netlify Serverless Function: /.netlify/functions/analyze-pagespeed
 *
 * Handles PageSpeed analysis + NVIDIA NIM AI audit for 5 standard categories:
 * Performance, SEO, Security, Accessibility, Best Practices.
 */

const NVIDIA_API_BASE = 'https://integrate.api.nvidia.com/v1';

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
    const { pageSpeedData, url } = JSON.parse(event.body || '{}');

    if (!pageSpeedData || !url) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields: pageSpeedData, url' }),
      };
    }

    const warnings = [];
    let aiReport;
    try {
      aiReport = await callNvidiaPageSpeedAI(pageSpeedData, url);
    } catch (err) {
      console.error('[Analyze-PageSpeed] NVIDIA AI failed:', err.message);
      aiReport = buildPageSpeedFallbackReport(pageSpeedData, url);
      warnings.push('PageSpeed AI analysis unavailable — report uses Google PageSpeed data only.');
    }

    aiReport.warnings = warnings;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(aiReport),
    };
  } catch (err) {
    console.error('[Analyze-PageSpeed] Unexpected error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', message: err.message }),
    };
  }
};

const CATEGORIES_5 = ['Performance', 'SEO', 'Security', 'Accessibility', 'Best Practices'];

const CATEGORY_CONFIGS_5 = [
  { id: 'performance', category: 'Performance', title: 'Performance Analysis', scoreKey: 'performance', source: 'google-pagespeed' },
  { id: 'seo', category: 'SEO', title: 'SEO Analysis', scoreKey: 'seo', source: 'google-pagespeed' },
  { id: 'security', category: 'Security', title: 'Security Analysis', scoreKey: 'security', source: 'google-pagespeed' },
  { id: 'accessibility', category: 'Accessibility', title: 'Accessibility Analysis', scoreKey: 'accessibility', source: 'google-pagespeed' },
  { id: 'best-practices', category: 'Best Practices', title: 'Best Practices', scoreKey: 'bestPractices', source: 'google-pagespeed' },
];

async function callNvidiaPageSpeedAI(pageSpeedData, url) {
  const apiKey = process.env.NVIDIA_API_KEY || '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';
  const model = process.env.NVIDIA_MODEL || 'deepseek-ai/deepseek-v4-flash-0731';

  if (!apiKey) {
    console.warn('[NVIDIA-PageSpeed] No API key configured');
    return buildPageSpeedFallbackReport(pageSpeedData, url);
  }

  const prompt = buildPageSpeedPrompt(pageSpeedData, url);

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
            content: `You are SiteProof AI, an expert web quality auditor. You analyze websites across 5 audit modules: Security, Performance, SEO, Accessibility, Best Practices.

You MUST respond with ONLY valid JSON. No markdown, no code fences, no explanations outside the JSON. Your response must parse with JSON.parse().`,
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 3000,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn('[NVIDIA-PageSpeed] AI request failed or timed out:', err.message);
    return buildPageSpeedFallbackReport(pageSpeedData, url);
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    console.error(`[NVIDIA-PageSpeed] API error ${response.status}:`, errText.slice(0, 500));
    return buildPageSpeedFallbackReport(pageSpeedData, url);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    return buildPageSpeedFallbackReport(pageSpeedData, url);
  }

  const parsed = extractJSON(content);
  if (!parsed) {
    return buildPageSpeedFallbackReport(pageSpeedData, url);
  }

  return normalizePageSpeedAIResponse(parsed, pageSpeedData, url, model);
}

function buildPageSpeedPrompt(pageSpeedData, url) {
  const domain = extractDomain(url);
  const obs = pageSpeedData.observatory;
  const secInfo = obs
    ? `${pageSpeedData.scores?.security ?? 'N/A'} (Mozilla / MDN HTTP Observatory Grade: ${obs.grade || 'N/A'}, Score: ${obs.score ?? 'N/A'}/100, Passed: ${obs.tests_passed || 0}/${obs.tests_quantity || 10})`
    : `${pageSpeedData.scores?.security ?? 'N/A'} (derived from HTTPS/Headers)`;

  return `Analyze the website "${url}" (${domain}) using ONLY the real scan data provided below.

## LIVE URL SCAN DATA (from Google PageSpeed Insights & Mozilla Observatory)

### Category Scores (0-100)
- Performance: ${pageSpeedData.scores?.performance ?? 'N/A'}
- SEO: ${pageSpeedData.scores?.seo ?? 'N/A'}
- Accessibility: ${pageSpeedData.scores?.accessibility ?? 'N/A'}
- Best Practices: ${pageSpeedData.scores?.bestPractices ?? 'N/A'}
- Security: ${secInfo}

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

## YOUR TASK
Produce a JSON object with this exact structure.

⚠️ CRITICAL RULES:
1. ALWAYS produce exactly 5 auditBreakdown entries, one for each category: ${CATEGORIES_5.join(', ')}.
2. DO NOT invent or fabricate data. Every check label MUST reference a specific metric or audit result.
3. SCORES MUST BE REAL: Your module scores (0.0 to 10.0) MUST be mathematically derived from the category scores provided (e.g. 85 = 8.5). If Mozilla Observatory data is present, for the 'security' module specify "source": "mozilla-observatory" and cite the MDN Grade.
4. FIX PROMPTS MUST BE ACTIONABLE & INCLUDE DEPLOYMENT: Every prompt in 'fixPrompts' MUST instruct the AI coding assistant to:
   - Identify root causes and apply replacement code directly to the repository.
   - Run build/tests to verify correctness.
   - Automatically build and deploy the changes (e.g., Netlify, Vercel, Git CI/CD) if it has deploy tools/permissions.
   - If the AI cannot deploy automatically, it MUST explicitly instruct the user at the end of its response:
     "⚠️ DEPLOYMENT REQUIRED: To see your improved score when rescanning in SiteProof, please deploy or publish these changes to your live website host (e.g., Netlify, Vercel, or custom host) before rescanning."

{
  "healthScore": <weighted overall score: Math.round(performance*0.25 + seo*0.2 + accessibility*0.2 + bestPractices*0.15 + security*0.2)>,
  "summary": "<2-3 sentence executive summary referencing actual scores and MDN security grade if present>",
  "verdict": "<one of: 'Production Ready', 'Needs Minor Fixes', 'Needs Work Before Launch', 'Critical Issues Found'>",
  "projectedScore": <number 0-100>,
  "auditBreakdown": [
    {
      "id": "<performance|seo|security|accessibility|best-practices>",
      "category": "<category name>",
      "title": "<module title>",
      "score": <PageSpeed score / 10 (0.0 to 10.0)>,
      "description": "<1-2 sentence finding>",
      "source": "google-pagespeed",
      "checks": [
        { "status": "<pass|fail|warn>", "label": "<check detail citing metrics>" }
      ]
    }
  ],
  "fixPrompts": [
    {
      "priority": "<CRITICAL|HIGH|MEDIUM|LOW>",
      "time": "<e.g. '15 mins'>",
      "title": "<short action title>",
      "detail": "<why this matters>",
      "impact": "<e.g. 'Est. +8 pts'>",
      "prompt": "<Direct instruction prompt for Cursor/Bolt/v0>",
      "code": "<example code snippet>"
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

Respond with ONLY the JSON object. No other text.`;
}

function formatIssuesForPrompt(issues) {
  if (issues.length === 0) return 'No issues detected.';
  return issues
    .slice(0, 20)
    .map((i) => `- [${String(i.severity || 'warn').toUpperCase()}] ${i.title || i.id}${i.displayValue ? ` (${i.displayValue})` : ''} - ${i.category || 'unknown'}`)
    .join('\n');
}

function normalizePageSpeedAIResponse(aiData, pageSpeedData, url, model = '') {
  const realHealthScore = getPageSpeedAverage(pageSpeedData);
  const auditBreakdown = buildPageSpeedAuditBreakdown(aiData.auditBreakdown || [], pageSpeedData);
  const rawFixPrompts = (aiData.fixPrompts || []).map((p) => ({
    priority: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(p.priority) ? p.priority : 'MEDIUM',
    time: p.time || '10 mins',
    title: p.title || 'Fix Issue',
    detail: p.detail || '',
    impact: p.impact || '+5 pts',
    prompt: p.prompt || buildAutomatedFixPrompt(extractDomain(url), p.title || 'Fix Issue', p.detail || ''),
    code: p.code || '',
  }));
  const projectedScore = calculateProjectedScore(realHealthScore, rawFixPrompts, aiData.projectedScore);
  const fixPrompts = normalizeFixPromptImpacts(rawFixPrompts, realHealthScore, projectedScore);

  return {
    healthScore: realHealthScore,
    summary: aiData.summary || pageSpeedData.summary || `Analysis of ${extractDomain(url)} complete.`,
    verdict: aiData.verdict || deriveVerdict(realHealthScore),
    projectedScore,
    auditBreakdown,
    fixPrompts,
    techStack: aiData.techStack || pageSpeedData.techStack || [],
    stats: aiData.stats || buildStats(auditBreakdown, pageSpeedData),
    source: 'nvidia-ai',
    model,
  };
}

function buildPageSpeedFallbackReport(pageSpeedData, url) {
  const domain = extractDomain(url);
  const overall = getPageSpeedAverage(pageSpeedData);
  const issues = pageSpeedData.issues || [];
  const auditBreakdown = buildPageSpeedAuditBreakdown([], pageSpeedData);

  const recs = pageSpeedData.recommendations || [];
  const rawFixPrompts = recs.map((rec) => ({
    priority: rec.priority || 'MEDIUM',
    time: rec.time || '10 mins',
    title: rec.title || 'Fix Issue',
    detail: rec.detail || '',
    impact: rec.impact || '+5 pts',
    prompt: buildAutomatedFixPrompt(domain, rec.title, rec.detail),
    code: '',
  }));

  if (rawFixPrompts.length < 3) {
    for (const issue of issues.filter((i) => i.severity === 'critical' || i.severity === 'high').slice(0, 5 - rawFixPrompts.length)) {
      rawFixPrompts.push({
        priority: issue.severity === 'critical' ? 'CRITICAL' : 'HIGH',
        time: '15 mins', title: issue.title, detail: issue.description,
        impact: '+5 pts',
        prompt: buildAutomatedFixPrompt(domain, issue.title, `${issue.category}, ${issue.severity}. ${issue.description}. ${issue.displayValue || ''}`),
        code: '',
      });
    }
  }

  const stats = buildStats(auditBreakdown, pageSpeedData);
  const projectedScore = calculateProjectedScore(overall, rawFixPrompts);
  const fixPrompts = normalizeFixPromptImpacts(rawFixPrompts, overall, projectedScore);

  return {
    healthScore: overall,
    summary: pageSpeedData.summary || `Analysis of ${domain} complete. Score: ${overall}/100.`,
    verdict: deriveVerdict(overall),
    projectedScore,
    auditBreakdown,
    fixPrompts,
    techStack: pageSpeedData.techStack || ['Standard Web'],
    stats,
    source: 'pagespeed-fallback',
    model: '',
  };
}

function buildPageSpeedAuditBreakdown(items, pageSpeedData) {
  const scores = pageSpeedData.scores || {};
  const modules = pageSpeedData.modules || [];
  const issues = pageSpeedData.issues || [];
  const observatory = pageSpeedData.observatory;

  return CATEGORY_CONFIGS_5.map((cfg) => {
    const aiItem = findMatchingBreakdownItem(items, cfg.id);
    const module = findMatchingBreakdownItem(modules, cfg.id);
    const isSecurity = cfg.id === 'security';
    const score = cfg.scoreKey
      ? (Number.isFinite(scores[cfg.scoreKey]) ? scores[cfg.scoreKey] / 10 : 0)
      : clampScore(aiItem?.score ?? module?.score ?? 0);
    const checks = normalizeChecks(aiItem?.checks || module?.checks || buildIssueChecks(issues, cfg.id));

    const source = isSecurity && (observatory || module?.source === 'mozilla-observatory')
      ? 'mozilla-observatory'
      : (aiItem?.source || module?.source || cfg.source);

    const title = isSecurity && observatory?.grade
      ? `Security (MDN Grade ${observatory.grade})`
      : (aiItem?.title || module?.title || cfg.title);

    return {
      id: cfg.id,
      category: cfg.category,
      title,
      score: score.toFixed(1),
      description: aiItem?.description || module?.description || buildModuleDescription(cfg, scores, issues),
      source,
      observatory: isSecurity ? (observatory || module?.observatory || null) : null,
      checks,
    };
  });
}

function findMatchingBreakdownItem(items, categoryId) {
  const wanted = canonicalCategory(categoryId);
  return (items || []).find((item) => {
    const id = canonicalCategory(item.id);
    const category = canonicalCategory(item.category);
    const title = canonicalCategory(item.title);
    return id === wanted || category === wanted || title.includes(wanted);
  });
}

function canonicalCategory(value = '') {
  const key = String(value).toLowerCase().replace(/[^a-z0-9]+/g, '');
  if (key === 'bestpractices') return 'bestpractices';
  if (key === 'codequality') return 'codequality';
  return key;
}

function normalizeChecks(checks) {
  return (checks || []).slice(0, 5).map((check) => ({
    status: ['pass', 'fail', 'warn'].includes(check.status) ? check.status : 'warn',
    label: check.label || check.title || 'Check result unavailable',
  }));
}

function buildIssueChecks(issues, categoryId) {
  const wanted = canonicalCategory(categoryId);
  const matches = issues.filter((issue) => canonicalCategory(issue.category) === wanted).slice(0, 5);
  if (matches.length === 0) {
    return [{ status: 'pass', label: 'No failed PageSpeed audits reported for this category' }];
  }
  return matches.map((issue) => ({
    status: issue.severity === 'critical' || issue.severity === 'high' ? 'fail' : 'warn',
    label: `${issue.title || issue.id}${issue.displayValue ? ` (${issue.displayValue})` : ''}`,
  }));
}

function buildModuleDescription(cfg, scores, issues) {
  const score = scores[cfg.scoreKey] ?? 0;
  const count = issues.filter((issue) => canonicalCategory(issue.category) === canonicalCategory(cfg.id)).length;
  return count > 0 ? `Found ${count} PageSpeed issue(s). Score: ${score}/100.` : `Score: ${score}/100 from Google PageSpeed.`;
}

function buildStats(auditBreakdown, pageSpeedData) {
  return {
    passedChecks: auditBreakdown.reduce((s, m) => s + (m.checks || []).filter((c) => c.status === 'pass').length, 0),
    failedChecks: auditBreakdown.reduce((s, m) => s + (m.checks || []).filter((c) => c.status === 'fail').length, 0),
    warningChecks: auditBreakdown.reduce((s, m) => s + (m.checks || []).filter((c) => c.status === 'warn').length, 0),
    criticalIssues: (pageSpeedData.issues || []).filter((i) => i.severity === 'critical').length,
  };
}

function extractImpactPoints(impact) {
  if (typeof impact === 'number') return Math.max(0, impact);
  if (typeof impact !== 'string') return 0;
  const match = impact.match(/(\d+(?:\.\d+)?)/);
  return match ? Math.max(0, Number.parseFloat(match[1])) : 0;
}

function calculateProjectedScore(currentScore, fixPrompts = [], aiProjectedScore) {
  const current = clamp(Math.round(Number(currentScore) || 0), 0, 100);
  const scoreCeiling = 98;
  const remainingRoom = Math.max(0, scoreCeiling - current);
  if (remainingRoom === 0 || fixPrompts.length === 0) return current;

  const estimatedImpact = fixPrompts.reduce((sum, item) => sum + extractImpactPoints(item?.impact), 0);
  const fallbackImpact = estimatedImpact > 0 ? estimatedImpact : Math.min(8, remainingRoom);
  const aiNumber = typeof aiProjectedScore === 'string' ? Number.parseFloat(aiProjectedScore) : aiProjectedScore;
  const aiImpact = Number.isFinite(aiNumber) ? Math.max(0, aiNumber - current) : 0;
  const gain = Math.min(Math.max(fallbackImpact, aiImpact), 20, remainingRoom);

  return clamp(Math.round(current + gain), 0, 100);
}

function normalizeFixPromptImpacts(fixPrompts = [], currentScore, projectedScore) {
  const current = clamp(Math.round(Number(currentScore) || 0), 0, 100);
  const projected = clamp(Math.round(Number(projectedScore) || current), 0, 100);
  const availableGain = Math.max(0, projected - current);
  const numericItems = fixPrompts.filter((item) => extractImpactPoints(item?.impact) > 0);
  const totalRawImpact = numericItems.reduce((sum, item) => sum + extractImpactPoints(item.impact), 0);

  if (numericItems.length === 0 || totalRawImpact === 0) {
    return fixPrompts.map((item) => ({ ...item }));
  }

  let allocated = 0;
  let numericIndex = 0;

  return fixPrompts.map((item) => {
    const rawImpact = extractImpactPoints(item?.impact);
    if (rawImpact === 0) return { ...item };

    numericIndex += 1;
    const isLastNumeric = numericIndex === numericItems.length;
    const remaining = Math.max(0, availableGain - allocated);
    const scaled = totalRawImpact > availableGain
      ? Math.round(rawImpact * (availableGain / totalRawImpact))
      : Math.round(rawImpact);
    const points = isLastNumeric ? remaining : Math.min(remaining, Math.max(0, scaled));
    allocated += points;

    return {
      ...item,
      impact: points > 0 ? `Est. +${points} pts` : 'Included in estimate',
    };
  });
}

function getPageSpeedAverage(pageSpeedData) {
  if (Number.isFinite(pageSpeedData.overallScore)) {
    return clamp(Math.round(pageSpeedData.overallScore), 0, 100);
  }

  const scores = pageSpeedData.scores || {};
  const perf = Number.isFinite(scores.performance) ? scores.performance : 70;
  const seo = Number.isFinite(scores.seo) ? scores.seo : 85;
  const a11y = Number.isFinite(scores.accessibility) ? scores.accessibility : 85;
  const bp = Number.isFinite(scores.bestPractices) ? scores.bestPractices : 85;
  const sec = Number.isFinite(scores.security) ? scores.security : 70;

  return Math.round(perf * 0.25 + seo * 0.20 + a11y * 0.20 + bp * 0.15 + sec * 0.20);
}

function clampScore(value) {
  const number = typeof value === 'string' ? parseFloat(value) : value;
  return clamp(Number.isFinite(number) ? number : 0, 0, 10);
}

function buildAutomatedFixPrompt(domain, title = 'Fix Issue', detail = '') {
  return `You are an AI Coding Assistant. Implement the following fix for the website ${domain} automatically.

Issue to Fix: ${title}
Details: ${detail}

Execution Instructions:
1. Inspect the repository, identify the exact file paths and code causing this issue, and apply the required changes directly.
2. Build and test the project (e.g., npm run build, run test suites) to ensure zero errors.
3. Deploy the updated build to production (e.g., Netlify, Vercel, or Git push). If automated deployment is not available in your environment, state the exact deploy commands or steps needed to publish the changes live.`;
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
