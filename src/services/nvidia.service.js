/**
 * NVIDIA AI Service — Client-Side Proxy & Parallel Orchestrator ("Split the Brain")
 *
 * This service calls two dedicated Netlify Serverless Functions in parallel:
 *   1. /.netlify/functions/analyze-pagespeed (5 standard web audit modules)
 *   2. /.netlify/functions/analyze-code (GitHub code extraction + Code Quality module)
 *
 * Both requests run concurrently via Promise.allSettled() to avoid serverless timeouts
 * and cut total scanning time in half.
 */
import { calculateProjectedScore, normalizeActionPlanImpacts } from '../utils/reportScoring';
import { isValidGithubRepo } from '../utils/validators';

/**
 * Execute parallel AI analysis for PageSpeed + GitHub Code Quality
 * @param {object} pageSpeedData - Parsed PageSpeed/Lighthouse results
 * @param {string|null} githubRepoUrl - GitHub repo URL (or null)
 * @param {string} url - The scanned website URL
 * @returns {Promise<object>} Combined 6-module AI audit report
 */
export async function analyzeWithAI(pageSpeedData, githubRepoUrl, url) {
  const hasGithub = Boolean(githubRepoUrl && isValidGithubRepo(githubRepoUrl).valid);

  // Trigger parallel requests
  const pageSpeedPromise = fetchPageSpeedAnalysis(pageSpeedData, url);
  const codePromise = hasGithub ? fetchCodeAnalysis(githubRepoUrl, url) : null;

  const promises = codePromise ? [pageSpeedPromise, codePromise] : [pageSpeedPromise];
  const results = await Promise.allSettled(promises);

  const pageSpeedResult = results[0];
  const codeResult = codePromise ? results[1] : null;

  // 1. Extract PageSpeed AI report (or fallback)
  let pageSpeedReport = null;
  if (pageSpeedResult.status === 'fulfilled' && pageSpeedResult.value) {
    pageSpeedReport = pageSpeedResult.value;
  } else {
    console.warn('[AI] PageSpeed function call failed or timed out — using client fallback:', pageSpeedResult.reason);
    pageSpeedReport = buildClientFallbackReport(pageSpeedData, url);
  }

  // 2. Extract Code Quality AI report (or null)
  let codeReport = null;
  if (codeResult && codeResult.status === 'fulfilled' && codeResult.value) {
    codeReport = codeResult.value;
  } else if (codeResult) {
    console.warn('[AI] Code quality function call failed or timed out:', codeResult.reason);
  }

  // 3. Merge both results into unified 6-module report
  return mergeParallelReports(pageSpeedReport, codeReport, pageSpeedData, githubRepoUrl, url);
}

/**
 * Call /.netlify/functions/analyze-pagespeed
 */
async function fetchPageSpeedAnalysis(pageSpeedData, url) {
  try {
    const response = await fetch('/.netlify/functions/analyze-pagespeed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageSpeedData, url }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `PageSpeed function error: ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    console.warn('[AI] fetchPageSpeedAnalysis failed:', err.message);
    return null;
  }
}

/**
 * Call /.netlify/functions/analyze-code
 */
async function fetchCodeAnalysis(githubRepoUrl, url) {
  try {
    const response = await fetch('/.netlify/functions/analyze-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ githubRepoUrl, url }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Code function error: ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    console.warn('[AI] fetchCodeAnalysis failed:', err.message);
    return null;
  }
}

/**
 * Merge PageSpeed AI report + Code Quality AI report into unified 6-module structure
 */
function mergeParallelReports(pageSpeedReport, codeReport, pageSpeedData, githubRepoUrl, url) {
  const warnings = [
    ...(pageSpeedReport.warnings || []),
    ...(codeReport?.warnings || []),
  ];

  // 1. Audit Breakdown (5 PageSpeed modules + 1 Code Quality module)
  const pageSpeedBreakdown = (pageSpeedReport.auditBreakdown || []).filter(
    (m) => String(m.id || '').toLowerCase() !== 'code-quality'
  );

  const codeQualityModule = codeReport?.auditBreakdown?.[0] || {
    id: 'code-quality',
    category: 'Code Quality',
    title: 'Code Quality',
    score: '0.0',
    description: githubRepoUrl
      ? `GitHub repository (${githubRepoUrl.replace('https://github.com/', '')}) code analysis was unavailable or timed out.`
      : 'No source code review was available. Link a GitHub repository and configure AI analysis for code quality checks.',
    source: 'github-code-review',
    checks: githubRepoUrl
      ? [{ status: 'warn', label: 'Code review timed out or failed — rest of report uses PageSpeed metrics' }]
      : [],
  };

  if (githubRepoUrl && (!codeReport || codeReport.source === 'code-fallback')) {
    warnings.push('GitHub code review was unavailable or timed out — report includes PageSpeed analysis only.');
  }

  const auditBreakdown = [...pageSpeedBreakdown, codeQualityModule];

  // 2. Fix Prompts (combine + sort by priority)
  const combinedFixPrompts = [
    ...(pageSpeedReport.fixPrompts || []),
    ...(codeReport?.fixPrompts || []),
  ];

  const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  combinedFixPrompts.sort((a, b) => (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2));

  // Deduplicate fix prompts by title
  const seenTitles = new Set();
  const fixPrompts = combinedFixPrompts.filter((p) => {
    const key = (p.title || '').toLowerCase().trim();
    if (!key || seenTitles.has(key)) return false;
    seenTitles.add(key);
    return true;
  });

  // 3. Recalculate stats over all 6 modules
  const stats = {
    passedChecks: auditBreakdown.reduce((s, m) => s + (m.checks || []).filter((c) => c.status === 'pass').length, 0),
    failedChecks: auditBreakdown.reduce((s, m) => s + (m.checks || []).filter((c) => c.status === 'fail').length, 0),
    warningChecks: auditBreakdown.reduce((s, m) => s + (m.checks || []).filter((c) => c.status === 'warn').length, 0),
    criticalIssues: (pageSpeedData?.issues || []).filter((i) => i.severity === 'critical').length,
  };

  const healthScore = pageSpeedReport.healthScore ?? 50;
  const projectedScore = pageSpeedReport.projectedScore ?? healthScore;

  return {
    healthScore,
    summary: pageSpeedReport.summary || `Analysis of ${extractDomain(url)} complete.`,
    verdict: pageSpeedReport.verdict || deriveVerdict(healthScore),
    projectedScore,
    auditBreakdown,
    fixPrompts,
    techStack: pageSpeedReport.techStack || pageSpeedData?.techStack || [],
    stats,
    source: pageSpeedReport.source || 'nvidia-ai',
    model: pageSpeedReport.model || '',
    warnings,
  };
}

/**
 * Client-side fallback when Netlify Functions are unavailable.
 */
function buildClientFallbackReport(pageSpeedData, url) {
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
      const catIssues = issues.filter((i) => i.category === d.id);
      auditBreakdown.push({
        id: d.id,
        category: d.title,
        title: d.title,
        score: (score / 10).toFixed(1),
        description: catIssues.length > 0 ? `Found ${catIssues.length} issues.` : `Score: ${score}/100`,
        source: 'google-pagespeed',
        checks: catIssues.slice(0, 5).map((i) => ({
          status: i.severity === 'critical' || i.severity === 'high' ? 'fail' : i.severity === 'medium' ? 'warn' : 'pass',
          label: `${i.title}${i.displayValue ? ` (${i.displayValue})` : ''}`,
        })),
      });
    }
  }

  if (!auditBreakdown.some((m) => ['codequality', 'code-quality'].includes(String(m.id || m.category || '').toLowerCase().replace(/\s+/g, '')))) {
    auditBreakdown.push({
      id: 'code-quality',
      category: 'Code Quality',
      title: 'Code Quality',
      score: '0.0',
      description: 'No source code review was available. Link a GitHub repository and configure AI analysis for code quality checks.',
      source: 'github-code-review',
      checks: [],
    });
  }

  const recs = pageSpeedData.recommendations || [];
  const rawFixPrompts = recs.map((rec) => ({
    priority: rec.priority || 'MEDIUM',
    time: rec.time || '10 mins',
    title: rec.title || 'Fix Issue',
    detail: rec.detail || '',
    impact: rec.impact || '+5 pts',
    prompt: `You are an AI Coding Assistant. Implement the following fix for the website ${domain} automatically.\n\nIssue to Fix: ${rec.title}\nDetails: ${rec.detail}\n\nTask: inspect the repository, identify the exact file paths and code causing this issue, then apply the replacement code needed to resolve it. Do not ask the user to manually fix it.`,
    code: '',
  }));

  if (rawFixPrompts.length < 3) {
    const critical = issues.filter((i) => i.severity === 'critical' || i.severity === 'high');
    for (const issue of critical.slice(0, 5 - rawFixPrompts.length)) {
      rawFixPrompts.push({
        priority: issue.severity === 'critical' ? 'CRITICAL' : 'HIGH',
        time: '15 mins',
        title: issue.title,
        detail: issue.description,
        impact: '+5 pts',
        prompt: `You are an AI Coding Assistant. Implement the following fix for the website ${domain} automatically.\n\nIssue to Fix: ${issue.title}\nCategory: ${issue.category}\nSeverity: ${issue.severity}\nCurrent Value: ${issue.displayValue || 'N/A'}\n\nTask: inspect the repository, identify the exact file paths and code causing this issue, then apply the replacement code needed to resolve it. Do not ask the user to manually fix it.`,
        code: '',
      });
    }
  }

  const projectedScore = calculateProjectedScore(overall, rawFixPrompts);
  const fixPrompts = normalizeActionPlanImpacts(rawFixPrompts, overall, projectedScore);

  const passedChecks = auditBreakdown.reduce((s, m) => s + (m.checks || []).filter((c) => c.status === 'pass').length, 0);
  const failedChecks = auditBreakdown.reduce((s, m) => s + (m.checks || []).filter((c) => c.status === 'fail').length, 0);
  const warningChecks = auditBreakdown.reduce((s, m) => s + (m.checks || []).filter((c) => c.status === 'warn').length, 0);

  return {
    healthScore: overall,
    summary: pageSpeedData.summary || `Analysis of ${domain} complete. Score: ${overall}/100.`,
    verdict: deriveVerdict(overall),
    projectedScore,
    auditBreakdown,
    fixPrompts,
    techStack: pageSpeedData.techStack || ['Standard Web'],
    stats: {
      passedChecks,
      failedChecks,
      warningChecks,
      criticalIssues: issues.filter((i) => i.severity === 'critical').length,
    },
    source: 'pagespeed-fallback',
  };
}

function deriveVerdict(score) {
  if (score >= 90) return 'Production Ready';
  if (score >= 75) return 'Needs Minor Fixes';
  if (score >= 50) return 'Needs Work Before Launch';
  return 'Critical Issues Found';
}

function extractDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  }
}
