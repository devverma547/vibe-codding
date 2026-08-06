/**
 * NVIDIA AI Service — Client-Side Proxy
 *
 * This service calls the secure Netlify Function (/.netlify/functions/analyze)
 * which handles NVIDIA API calls server-side. The API key is NEVER exposed
 * to the browser.
 *
 * The function also handles GitHub code extraction server-side.
 */

/**
 * Send PageSpeed data + GitHub repo URL to the secure Netlify Function
 * for AI analysis. The function handles:
 *   1. GitHub code extraction (with GITHUB_TOKEN, 5,000 req/hr)
 *   2. NVIDIA NIM AI call (key secure on server)
 *   3. Robust JSON parsing of AI response
 *
 * @param {object} pageSpeedData - Parsed PageSpeed/Lighthouse results
 * @param {string|null} githubRepoUrl - GitHub repo URL (or null)
 * @param {string} url - The scanned URL
 * @returns {Promise<object>} Structured AI analysis report
 */
export async function analyzeWithAI(pageSpeedData, githubRepoUrl, url) {
  try {
    const response = await fetch('/.netlify/functions/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageSpeedData, githubRepoUrl, url }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error(`[AI] Netlify function error ${response.status}:`, errData);

      // If function is not deployed or unavailable, use fallback
      if (response.status === 404) {
        console.warn('[AI] Netlify function not found — using PageSpeed fallback');
        return buildClientFallbackReport(pageSpeedData, url);
      }

      throw new Error(errData.error || `Server error: ${response.status}`);
    }

    const aiReport = await response.json();

    // Validate the response has required fields
    if (!aiReport || typeof aiReport.healthScore !== 'number') {
      console.warn('[AI] Invalid response structure, using fallback');
      return buildClientFallbackReport(pageSpeedData, url);
    }

    return aiReport;
  } catch (err) {
    console.error('[AI] Failed to reach analysis function:', err.message);
    // Graceful fallback: still produce a report from PageSpeed data
    return buildClientFallbackReport(pageSpeedData, url);
  }
}

/**
 * Client-side fallback when the Netlify Function is unavailable.
 * Produces a structured report from PageSpeed data alone.
 */
function buildClientFallbackReport(pageSpeedData, url) {
  const domain = extractDomain(url);
  const scores = pageSpeedData.scores || {};
  const overall = pageSpeedData.overallScore || 50;
  const issues = pageSpeedData.issues || [];
  const modules = pageSpeedData.modules || [];

  // Build audit breakdown from PageSpeed modules
  const auditBreakdown = modules.map((m) => ({
    id: m.id,
    category: m.title || m.id,
    title: m.title,
    score: m.score,
    description: m.description,
    source: 'google-pagespeed',
    checks: m.checks || [],
  }));

  // Fallback if no modules exist
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

  // Build fix prompts from recommendations
  const recs = pageSpeedData.recommendations || [];
  const fixPrompts = recs.map((rec) => ({
    priority: rec.priority || 'MEDIUM',
    time: rec.time || '10 mins',
    title: rec.title || 'Fix Issue',
    detail: rec.detail || '',
    impact: rec.impact || '+5 pts',
    prompt: `Act as an expert web developer. My website ${domain} needs: ${rec.title}. ${rec.detail}. Provide the exact code changes needed.`,
    code: '',
  }));

  // Add prompts from critical issues if we don't have enough
  if (fixPrompts.length < 3) {
    const critical = issues.filter((i) => i.severity === 'critical' || i.severity === 'high');
    for (const issue of critical.slice(0, 5 - fixPrompts.length)) {
      fixPrompts.push({
        priority: issue.severity === 'critical' ? 'CRITICAL' : 'HIGH',
        time: '15 mins',
        title: issue.title,
        detail: issue.description,
        impact: '+5 pts',
        prompt: `Act as an expert web developer. My website ${domain} has this issue:\n\nIssue: ${issue.title}\nCategory: ${issue.category}\nSeverity: ${issue.severity}\n${issue.displayValue ? `Current: ${issue.displayValue}` : ''}\n\nPlease provide the exact code fix.`,
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
    verdict: overall >= 90 ? 'Production Ready' : overall >= 75 ? 'Needs Minor Fixes' : overall >= 50 ? 'Needs Work Before Launch' : 'Critical Issues Found',
    projectedScore: Math.min(overall + 17, 98),
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

function extractDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  }
}
