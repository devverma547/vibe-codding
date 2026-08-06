/**
 * Lighthouse Service — Google PageSpeed Insights API
 * 
 * Calls the FREE Google PageSpeed Insights API to get real
 * Lighthouse scores for any website. No API key needed.
 */

const PAGESPEED_API = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

/**
 * Run a full Lighthouse analysis on a URL
 * @param {string} url - The URL to analyze
 * @param {string} strategy - 'mobile' or 'desktop'
 * @returns {Promise<object>} Parsed lighthouse results
 */
export async function runLighthouseAnalysis(url, strategy = 'mobile') {
  const apiKey = import.meta.env.VITE_PAGESPEED_API_KEY || '';
  const params = new URLSearchParams({
    url,
    strategy,
    category: 'PERFORMANCE',
  });
  // Append additional categories (URLSearchParams supports duplicate keys)
  params.append('category', 'SEO');
  params.append('category', 'ACCESSIBILITY');
  params.append('category', 'BEST_PRACTICES');
  // Add API key for higher quota (25 → 25,000 requests/day)
  if (apiKey) {
    params.append('key', apiKey);
  }

  const response = await fetch(`${PAGESPEED_API}?${params.toString()}`);

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    if (response.status === 429) {
      throw new Error('Rate limited by Google. Please wait a minute and try again.');
    }
    if (response.status === 400) {
      throw new Error('Could not analyze this URL. Make sure the website is publicly accessible.');
    }
    throw new Error(`Lighthouse API error (${response.status}): ${errorBody.slice(0, 200)}`);
  }

  const data = await response.json();
  return parseLighthouseResults(data, url);
}

/**
 * Parse raw PageSpeed API response into our report format
 */
function parseLighthouseResults(data, url) {
  const lhr = data.lighthouseResult || {};
  const categories = lhr.categories || {};
  const audits = lhr.audits || {};

  // --- Category Scores (0-100) ---
  const scores = {
    performance: Math.round((categories.performance?.score || 0) * 100),
    seo: Math.round((categories.seo?.score || 0) * 100),
    accessibility: Math.round((categories.accessibility?.score || 0) * 100),
    bestPractices: Math.round((categories['best-practices']?.score || 0) * 100),
  };

  // Derive a security score from best-practices + HTTPS checks
  const isHttps = url.startsWith('https://');
  const httpsAudit = audits['is-on-https'];
  const httpsPass = httpsAudit?.score === 1;
  let securityScore = scores.bestPractices;
  if (!isHttps || !httpsPass) {
    securityScore = Math.max(0, securityScore - 30);
  }
  scores.security = securityScore;

  // Overall score = weighted average
  const overall = Math.round(
    scores.performance * 0.25 +
    scores.seo * 0.2 +
    scores.accessibility * 0.2 +
    scores.bestPractices * 0.15 +
    scores.security * 0.2
  );

  // --- Extract Issues from failed/warning audits ---
  const issues = [];
  const categoryAuditMap = buildCategoryAuditMap(categories);

  for (const [auditId, audit] of Object.entries(audits)) {
    // Skip informational or not-applicable audits
    if (audit.score === null || audit.score === undefined || audit.scoreDisplayMode === 'notApplicable' || audit.scoreDisplayMode === 'informative') {
      continue;
    }
    // Only include audits that didn't fully pass
    if (audit.score < 1) {
      const severity = audit.score === 0 ? 'critical'
        : audit.score < 0.5 ? 'high'
        : audit.score < 0.9 ? 'medium'
        : 'low';

      issues.push({
        id: auditId,
        title: audit.title || auditId,
        description: stripMarkdownLinks(audit.description || ''),
        category: categoryAuditMap[auditId] || 'bestPractices',
        severity,
        score: audit.score,
        displayValue: audit.displayValue || '',
        suggestedFix: stripMarkdownLinks(audit.description || ''),
      });
    }
  }

  // Sort issues: critical first, then high, medium, low
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  issues.sort((a, b) => (severityOrder[a.severity] || 4) - (severityOrder[b.severity] || 4));

  // --- Core Web Vitals ---
  const loadingExp = data.loadingExperience?.metrics || {};
  const webVitals = {
    lcp: loadingExp.LARGEST_CONTENTFUL_PAINT_MS?.percentile,
    fid: loadingExp.FIRST_INPUT_DELAY_MS?.percentile,
    cls: loadingExp.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile,
    fcp: loadingExp.FIRST_CONTENTFUL_PAINT_MS?.percentile,
    inp: loadingExp.INTERACTION_TO_NEXT_PAINT?.percentile,
    ttfb: loadingExp.EXPERIMENTAL_TIME_TO_FIRST_BYTE?.percentile,
  };

  // --- Detect technology stack ---
  const techStack = detectTechStack(audits, lhr);

  // --- Risk Level ---
  const riskLevel = overall >= 80 ? 'Low'
    : overall >= 60 ? 'Medium'
    : overall >= 40 ? 'High'
    : 'Critical';

  // --- Summary ---
  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  const highCount = issues.filter(i => i.severity === 'high').length;
  const domain = extractDomain(url);
  const summary = `Analysis of ${domain} returned an overall health score of ${overall}/100. ` +
    `Found ${issues.length} issues (${criticalCount} critical, ${highCount} high priority). ` +
    `Performance scored ${scores.performance}/100, SEO ${scores.seo}/100, ` +
    `Accessibility ${scores.accessibility}/100, Security ${scores.security}/100.`;

  // --- Build Modules (for report page display) ---
  const modules = buildModules(scores, audits, categories);

  // --- Recommendations ---
  const recommendations = buildRecommendations(scores, issues);

  return {
    scores,
    overallScore: overall,
    issues,
    webVitals,
    techStack,
    riskLevel,
    summary,
    modules,
    recommendations,
    issuesCount: issues.length,
    criticalCount,
  };
}

/**
 * Build a map: auditId -> category name
 */
function buildCategoryAuditMap(categories) {
  const map = {};
  const catNameMap = {
    'performance': 'performance',
    'seo': 'seo',
    'accessibility': 'accessibility',
    'best-practices': 'bestPractices',
  };
  for (const [catKey, catData] of Object.entries(categories)) {
    const refs = catData.auditRefs || [];
    for (const ref of refs) {
      map[ref.id] = catNameMap[catKey] || catKey;
    }
  }
  return map;
}

/**
 * Build display modules for the report page
 */
function buildModules(scores, audits, categories) {
  const moduleConfigs = [
    { id: 'security', title: 'Security Analysis', scoreKey: 'security', catKey: null },
    { id: 'performance', title: 'Performance Analysis', scoreKey: 'performance', catKey: 'performance' },
    { id: 'seo', title: 'SEO Analysis', scoreKey: 'seo', catKey: 'seo' },
    { id: 'accessibility', title: 'Accessibility Analysis', scoreKey: 'accessibility', catKey: 'accessibility' },
    { id: 'bestPractices', title: 'Best Practices', scoreKey: 'bestPractices', catKey: 'best-practices' },
  ];

  return moduleConfigs.map(cfg => {
    const score = (scores[cfg.scoreKey] / 10).toFixed(1);

    // Get checks from category audit refs
    let checks = [];
    if (cfg.catKey && categories[cfg.catKey]) {
      const refs = categories[cfg.catKey].auditRefs || [];
      // Pick up to 5 most relevant audits
      const relevantRefs = refs.slice(0, 8);
      for (const ref of relevantRefs) {
        const audit = audits[ref.id];
        if (!audit || audit.scoreDisplayMode === 'notApplicable') continue;
        const status = audit.score === 1 ? 'pass' : audit.score === 0 ? 'fail' : 'warn';
        checks.push({
          status,
          label: `${audit.title}${audit.displayValue ? ` (${audit.displayValue})` : ''}`,
        });
      }
    } else if (cfg.id === 'security') {
      // Build security checks from relevant audits
      const secAudits = ['is-on-https', 'redirects-http', 'no-vulnerable-libraries', 'csp-xss'];
      for (const auditId of secAudits) {
        const audit = audits[auditId];
        if (!audit) continue;
        const status = audit.score === 1 ? 'pass' : audit.score === 0 ? 'fail' : 'warn';
        checks.push({ status, label: audit.title || auditId });
      }
      if (checks.length === 0) {
        const httpsCheck = audits['is-on-https'];
        checks.push({
          status: httpsCheck?.score === 1 ? 'pass' : 'fail',
          label: 'HTTPS / SSL Certificate',
        });
      }
    }

    // Limit to 5 checks per module for clean display
    checks = checks.slice(0, 5);

    // Generate description
    const passCount = checks.filter(c => c.status === 'pass').length;
    const failCount = checks.filter(c => c.status === 'fail').length;
    const description = failCount > 0
      ? `${failCount} check(s) failed. ${passCount} passed.`
      : passCount > 0
      ? `All ${passCount} checks passed.`
      : `Score: ${scores[cfg.scoreKey]}/100`;

    return {
      id: cfg.id,
      title: cfg.title,
      score,
      description,
      checks,
    };
  });
}

/**
 * Build AI-style recommendations from real data
 */
function buildRecommendations(scores, issues) {
  const recs = [];

  if (scores.security < 80) {
    recs.push({
      priority: 'CRITICAL',
      time: '15 mins',
      title: 'Strengthen Security Posture',
      detail: 'Your security score indicates missing protections. Implement HTTPS, security headers, and address vulnerable dependencies.',
      impact: `+${Math.min(20, 100 - scores.security)} pts`,
      category: 'security',
    });
  }

  if (scores.performance < 75) {
    const perfIssues = issues.filter(i => i.category === 'performance').slice(0, 2);
    const topIssue = perfIssues[0]?.title || 'asset optimization';
    recs.push({
      priority: 'HIGH',
      time: '20 mins',
      title: 'Optimize Page Performance',
      detail: `Key bottleneck: ${topIssue}. Addressing performance issues will improve load times and user experience.`,
      impact: `+${Math.min(20, 100 - scores.performance)} pts`,
      category: 'performance',
    });
  }

  if (scores.seo < 80) {
    const seoIssues = issues.filter(i => i.category === 'seo').slice(0, 2);
    const topIssue = seoIssues[0]?.title || 'meta tags';
    recs.push({
      priority: 'HIGH',
      time: '10 mins',
      title: 'Improve Search Engine Visibility',
      detail: `Top fix needed: ${topIssue}. Better SEO means more organic traffic.`,
      impact: `+${Math.min(15, 100 - scores.seo)} pts`,
      category: 'seo',
    });
  }

  if (scores.accessibility < 80) {
    recs.push({
      priority: 'HIGH',
      time: '15 mins',
      title: 'Fix Accessibility Issues',
      detail: 'Improve color contrast, add alt text, and ensure keyboard navigation works for all users.',
      impact: `+${Math.min(15, 100 - scores.accessibility)} pts`,
      category: 'accessibility',
    });
  }

  if (scores.bestPractices < 80) {
    recs.push({
      priority: 'MEDIUM',
      time: '10 mins',
      title: 'Address Best Practice Violations',
      detail: 'Fix deprecated APIs, ensure proper image aspect ratios, and resolve console errors.',
      impact: `+${Math.min(10, 100 - scores.bestPractices)} pts`,
      category: 'bestPractices',
    });
  }

  // Always add a monitoring recommendation
  recs.push({
    priority: 'LOW',
    time: '5 mins',
    title: 'Set Up Regular Monitoring',
    detail: 'Schedule weekly re-scans to track improvements and catch regressions early.',
    impact: 'Ongoing',
    category: 'general',
  });

  return recs;
}

/**
 * Detect tech stack from Lighthouse audits
 */
function detectTechStack(audits, lhr) {
  const stack = [];
  const stacks = lhr.stackPacks || [];
  for (const sp of stacks) {
    stack.push(sp.title || sp.id);
  }

  // Fallback detection from audits
  if (stack.length === 0) {
    const scripts = audits['network-requests']?.details?.items || [];
    const urlStr = JSON.stringify(scripts).toLowerCase();
    if (urlStr.includes('react')) stack.push('React');
    if (urlStr.includes('vue')) stack.push('Vue.js');
    if (urlStr.includes('angular')) stack.push('Angular');
    if (urlStr.includes('next')) stack.push('Next.js');
    if (urlStr.includes('wordpress')) stack.push('WordPress');
  }

  const isHttps = audits['is-on-https']?.score === 1;
  if (isHttps) stack.push('HTTPS/SSL');

  if (stack.length === 0) stack.push('Standard Web');

  return stack;
}

/**
 * Strip markdown-style links from Lighthouse descriptions
 */
function stripMarkdownLinks(text) {
  if (!text) return '';
  return text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
}

/**
 * Extract domain from URL
 */
function extractDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  }
}
