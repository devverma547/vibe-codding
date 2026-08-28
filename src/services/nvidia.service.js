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
import { calculateProjectedScore, normalizeActionPlanImpacts, formatAiFixPrompt } from '../utils/reportScoring';
import { isValidGithubRepo } from '../utils/validators';

/**
 * Execute parallel AI analysis for PageSpeed + GitHub Code Quality
 * @param {object} pageSpeedData - Parsed PageSpeed/Lighthouse results
 * @param {string|null} githubRepoUrl - GitHub repo URL (or null)
 * @param {string} url - The scanned website URL
 * @param {Promise|null} [inFlightCodePromise] - Pre-fetched code analysis promise (for early parallel execution)
 * @returns {Promise<object>} Combined 6-module AI audit report
 */
export async function analyzeWithAI(pageSpeedData, githubRepoUrl, url, inFlightCodePromise = null) {
  const hasGithub = Boolean(githubRepoUrl && isValidGithubRepo(githubRepoUrl).valid);

  // Trigger parallel requests
  const pageSpeedPromise = fetchPageSpeedAnalysis(pageSpeedData, url);
  const codePromise = inFlightCodePromise || (hasGithub ? fetchCodeAnalysis(githubRepoUrl, url) : null);

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
    pageSpeedReport = buildClientFallbackReport(pageSpeedData, url, githubRepoUrl);
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
export async function fetchPageSpeedAnalysis(pageSpeedData, url) {
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

    const contentType = response.headers?.get?.('content-type') || '';
    if (contentType && !contentType.includes('application/json')) {
      throw new Error('PageSpeed function returned non-JSON response (SPA redirect)');
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
export async function fetchCodeAnalysis(githubRepoUrl, url) {
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

    const contentType = response.headers?.get?.('content-type') || '';
    if (contentType && !contentType.includes('application/json')) {
      throw new Error('Code function returned non-JSON response (SPA redirect)');
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
export function mergeParallelReports(pageSpeedReport, codeReport, pageSpeedData, githubRepoUrl, url) {
  const warnings = [
    ...(pageSpeedReport.warnings || []),
    ...(codeReport?.warnings || []),
  ];

  // 1. Audit Breakdown (Merge 12 modules from pageSpeedData with AI recommendations)
  const base12Modules = pageSpeedData?.modules || [];
  const aiBreakdownMap = new Map((pageSpeedReport.auditBreakdown || []).map((m) => [m.id, m]));
  
  const auditBreakdown = base12Modules.map((baseMod) => {
    const aiMod = aiBreakdownMap.get(baseMod.id);
    if (aiMod) {
      const isObservatory = baseMod.id === 'security' && (baseMod.source === 'mozilla-observatory' || baseMod.observatory || pageSpeedData?.observatory);
      return {
        ...baseMod,
        ...aiMod,
        title: isObservatory ? (baseMod.title || aiMod.title) : (aiMod.title || baseMod.title),
        source: isObservatory ? 'mozilla-observatory' : (aiMod.source || baseMod.source || 'google-pagespeed'),
        observatory: isObservatory ? (baseMod.observatory || pageSpeedData?.observatory || null) : null,
        score: isObservatory && baseMod.score ? baseMod.score : (aiMod.score || baseMod.score),
        checks: isObservatory && baseMod.checks?.length > 0 ? baseMod.checks : (aiMod.checks && aiMod.checks.length > 0 ? aiMod.checks : baseMod.checks),
        description: isObservatory && baseMod.description ? baseMod.description : (aiMod.description || baseMod.description),
      };
    }
    return baseMod;
  });

  // If code quality module exists from GitHub code report, update codeQuality module in breakdown
  if (codeReport?.auditBreakdown?.[0]) {
    const codeModIdx = auditBreakdown.findIndex((m) => m.id === 'codeQuality' || m.id === 'code-quality');
    if (codeModIdx !== -1) {
      auditBreakdown[codeModIdx] = {
        ...auditBreakdown[codeModIdx],
        score: codeReport.auditBreakdown[0].score || auditBreakdown[codeModIdx].score,
        checks: [...(codeReport.auditBreakdown[0].checks || []), ...(auditBreakdown[codeModIdx].checks || [])].slice(0, 5),
      };
    }
  }

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

  // 3. Recalculate stats over all modules
  const stats = {
    passedChecks: auditBreakdown.reduce((s, m) => s + (m.checks || []).filter((c) => c.status === 'pass').length, 0),
    failedChecks: auditBreakdown.reduce((s, m) => s + (m.checks || []).filter((c) => c.status === 'fail').length, 0),
    warningChecks: auditBreakdown.reduce((s, m) => s + (m.checks || []).filter((c) => c.status === 'warn').length, 0),
    criticalIssues: (pageSpeedData?.issues || []).filter((i) => i.severity === 'critical').length,
  };

  // Sync healthScore with real weighted scores incorporating Mozilla Observatory
  const perf = Number(pageSpeedData?.scores?.performance) || 70;
  const seo = Number(pageSpeedData?.scores?.seo) || 85;
  const a11y = Number(pageSpeedData?.scores?.accessibility) || 85;
  const bp = Number(pageSpeedData?.scores?.bestPractices) || 85;
  const sec = Number(pageSpeedData?.scores?.security) || (pageSpeedData?.observatory?.score ?? 70);
  const weightedScore = Math.round(perf * 0.25 + seo * 0.20 + a11y * 0.20 + bp * 0.15 + sec * 0.20);
  const healthScore = Number.isFinite(pageSpeedData?.overallScore) ? pageSpeedData.overallScore : weightedScore;
  const projectedScore = pageSpeedReport.projectedScore ?? Math.min(98, healthScore + 12);

  let summary = pageSpeedReport.summary || `Analysis of ${extractDomain(url)} complete.`;
  if (pageSpeedData?.observatory && summary.includes('Security 100/100')) {
    const obs = pageSpeedData.observatory;
    summary = summary.replace('Security 100/100', `Security ${sec}/100 (MDN Observatory Grade ${obs.grade || 'B'})`);
  }

  return {
    healthScore,
    summary,
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
function buildClientFallbackReport(pageSpeedData, url, githubRepoUrl = '') {
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
    source: m.source || 'google-pagespeed',
    observatory: m.observatory || null,
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
    prompt: formatAiFixPrompt(domain, rec.title, rec.detail, githubRepoUrl),
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
        prompt: formatAiFixPrompt(domain, issue.title, `${issue.category}, ${issue.severity}. ${issue.description}. ${issue.displayValue || ''}`, githubRepoUrl),
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
