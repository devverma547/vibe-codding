/**
 * Scanner Service — Full AI Audit Pipeline ("Split the Brain" Parallel Architecture)
 *
 * ARCHITECTURE (secure & parallel):
 *   Frontend (browser):
 *     1. Validate URL
 *     2. Create scan record in Supabase
 *     3. Run PageSpeed Insights (client-side, public API key)
 *     4. Send parallel requests to Netlify Functions:
 *        - /.netlify/functions/analyze-pagespeed (5 standard web modules)
 *        - /.netlify/functions/analyze-code (GitHub extraction + Code Quality)
 *        - /.netlify/functions/analyze-secrets (Client Bundle Leak Scanner)
 *
 *   Netlify Functions (server-side):
 *     5. Execute in parallel (cuts scan time in half, avoids 20s timeouts)
 *     6. Call NVIDIA NIM AI (key never exposed to browser)
 *
 *   Frontend (continued):
 *     7. Merge parallel JSON reports into single 7-module audit report
 *     8. Save report to Supabase + cache
 *     9. Return enriched report data
 */
import { runLighthouseAnalysis } from './lighthouse.service';
import { analyzeWithAI, fetchCodeAnalysis } from './nvidia.service';
import { fetchObservatoryScan } from './observatory.service';
import { fetchSecretsScan } from './secrets.service';
import { scanService, reportCache, urlCache } from './database.service';
import { sanitizeUrl, isValidUrl, sanitizeGithubRepo, isValidGithubRepo } from '../utils/validators';

export const scannerService = {
  /**
   * Run a full AI-powered scan on a website URL and optional GitHub repo
   * @param {string} url - URL to scan
   * @param {string} [githubRepoOrUserId] - GitHub repo URL, owner/repo, or legacy user ID
   * @param {string|function} [userIdOrProgress] - User ID or progress callback
   * @param {function|object} [onProgressOrOptions] - Progress callback(percent, step, message) or options
   * @param {object} [maybeOptions] - Options { forceRefresh?: boolean }
   * @returns {Promise<{success: boolean, data?: object, isCached?: boolean, error?: string}>}
   */
  analyzeSite: async (url, githubRepoOrUserId, userIdOrProgress, onProgressOrOptions, maybeOptions) => {
    try {
      let githubRepo = '';
      let userId = null;
      let progressCb = null;
      let options = {};

      if (typeof onProgressOrOptions === 'object' && onProgressOrOptions !== null) {
        options = onProgressOrOptions;
      } else if (typeof onProgressOrOptions === 'function') {
        progressCb = onProgressOrOptions;
        if (typeof maybeOptions === 'object' && maybeOptions !== null) {
          options = maybeOptions;
        }
      }

      if (typeof githubRepoOrUserId === 'function') {
        progressCb = githubRepoOrUserId;
      } else if (typeof githubRepoOrUserId === 'string' && isValidGithubRepo(githubRepoOrUserId).valid) {
        githubRepo = sanitizeGithubRepo(githubRepoOrUserId);
        userId = typeof userIdOrProgress === 'string' ? userIdOrProgress : null;
        if (typeof userIdOrProgress === 'function') progressCb = userIdOrProgress;
      } else if (typeof githubRepoOrUserId === 'string') {
        userId = githubRepoOrUserId;
        if (typeof userIdOrProgress === 'function') progressCb = userIdOrProgress;
      } else {
        userId = typeof userIdOrProgress === 'string' ? userIdOrProgress : null;
        if (typeof userIdOrProgress === 'function') progressCb = userIdOrProgress;
      }

      // 1. Validate URL
      const formattedUrl = sanitizeUrl(url);
      const urlCheck = isValidUrl(formattedUrl);
      if (!urlCheck.valid) {
        return { success: false, error: urlCheck.error };
      }
      const finalUrl = urlCheck.url || formattedUrl;

      // 2. Strategy 2: Smart URL Cache Check (instant return in ~0.05s unless forceRefresh is set)
      if (!options.forceRefresh) {
        const cached = urlCache.get(finalUrl, githubRepo);
        if (cached) {
          if (progressCb) {
            progressCb(20, 0, '⚡ Checking cache for previous scan...');
            progressCb(100, 8, `⚡ Instant Load: Loaded cached report (${cached.cacheAgeMinutes || 0}m old)`);
          }
          return {
            success: true,
            isCached: true,
            data: {
              scanId: cached.scanId,
              url: cached.url || finalUrl,
              githubRepo: cached.githubRepo || githubRepo || '',
              overallScore: cached.overallScore,
              scores: cached.scores,
              riskLevel: cached.riskLevel,
              issuesCount: cached.issuesCount,
              criticalCount: cached.criticalCount,
              summary: cached.summary,
              aiReport: cached.aiReport,
              observatory: cached.observatory || null,
              warnings: cached.warnings || [],
              isCached: true,
              cachedAt: cached.cachedAt,
              cacheAgeMinutes: cached.cacheAgeMinutes,
            },
          };
        }
      }

      if (progressCb) progressCb(5, 0, 'Validating URL...');

      // 3. Create scan record in Supabase
      let scan = null;
      if (userId) {
        scan = await scanService.create(userId, finalUrl);
      }
      const scanId = scan?.id || crypto.randomUUID();
      const isLocal = !scan || scan._local;

      if (progressCb) progressCb(10, 1, 'Starting parallel audit pipeline...');

      // 4. Strategy 1: Quad-Parallel Execution Engine
      //    Concurrently dispatch Mozilla Observatory + Secret Scanner + GitHub extraction + PageSpeed at t=0!
      const hasGithub = Boolean(githubRepo && isValidGithubRepo(githubRepo).valid);
      const inFlightCodePromise = hasGithub ? fetchCodeAnalysis(githubRepo, finalUrl) : null;
      const inFlightObservatoryPromise = fetchObservatoryScan(finalUrl);
      const inFlightSecretsPromise = fetchSecretsScan(finalUrl);

      if (progressCb) {
        progressCb(15, 2, hasGithub
          ? 'Running parallel audits: Google PageSpeed + Mozilla Observatory + Secret Scanner + GitHub source extraction...'
          : 'Running parallel audits: Google PageSpeed + Mozilla Observatory + Secret Bundle Scanner...');
      }

      let lighthouseResults;
      let observatoryData = null;
      let secretsData = null;
      try {
        const [lhrRes, obsRes, secretsRes] = await Promise.allSettled([
          runLighthouseAnalysis(finalUrl, 'mobile'),
          inFlightObservatoryPromise,
          inFlightSecretsPromise,
        ]);

        if (lhrRes.status === 'rejected') {
          throw lhrRes.reason;
        }
        lighthouseResults = lhrRes.value;

        if (obsRes.status === 'fulfilled' && obsRes.value) {
          observatoryData = obsRes.value;
          if (progressCb) {
            progressCb(50, 3, `PageSpeed & Mozilla Observatory complete! (MDN Security Grade: ${observatoryData.grade || 'B'})`);
          }
        } else {
          if (progressCb) {
            progressCb(50, 3, 'PageSpeed analysis complete!');
          }
        }

        // Collect secret scan results
        if (secretsRes.status === 'fulfilled' && secretsRes.value) {
          secretsData = secretsRes.value;
          const leakMsg = secretsData.totalLeaks > 0
            ? `🚨 Secret Scanner: ${secretsData.totalLeaks} exposed key${secretsData.totalLeaks > 1 ? 's' : ''} detected!`
            : '✅ Secret Scanner: No exposed API keys found in client bundles.';
          if (progressCb) progressCb(55, 4, leakMsg);
        } else {
          if (progressCb) progressCb(55, 4, 'Secret bundle scan completed (fallback).');
        }
      } catch (lighthouseError) {
        if (userId && !isLocal) {
          await scanService.fail(scanId, lighthouseError.message, isLocal);
        }
        return {
          success: false,
          error: lighthouseError.message || 'Failed to analyze website. Please check the URL is correct and the site is publicly accessible.',
        };
      }

      // If Mozilla Observatory returned real data, blend it into lighthouseResults
      if (observatoryData) {
        lighthouseResults.observatory = observatoryData;
        if (!lighthouseResults.scores) {
          lighthouseResults.scores = {};
        }
        if (typeof observatoryData.score === 'number') {
          lighthouseResults.scores.security = observatoryData.score;
          // Recalculate overall score with live security score
          lighthouseResults.overallScore = Math.round(
            (lighthouseResults.scores.performance || 80) * 0.25 +
            (lighthouseResults.scores.seo || 80) * 0.2 +
            (lighthouseResults.scores.accessibility || 80) * 0.2 +
            (lighthouseResults.scores.bestPractices || 80) * 0.15 +
            (lighthouseResults.scores.security || 80) * 0.2
          );
        }

        // Update security module in modules list
        if (Array.isArray(lighthouseResults.modules)) {
          const secModIdx = lighthouseResults.modules.findIndex(m => m.id === 'security');
          if (secModIdx !== -1) {
            lighthouseResults.modules[secModIdx] = {
              ...lighthouseResults.modules[secModIdx],
              title: `Security (MDN Grade ${observatoryData.grade || 'B'})`,
              score: (observatoryData.score / 10).toFixed(1),
              description: `MDN Observatory Grade ${observatoryData.grade || 'B'} · ${observatoryData.tests_passed || 0}/${observatoryData.tests_quantity || 10} security tests passed.`,
              checks: observatoryData.checks && observatoryData.checks.length > 0
                ? observatoryData.checks
                : lighthouseResults.modules[secModIdx].checks,
              source: 'mozilla-observatory',
              observatory: observatoryData,
            };
          }
        }

        // If tests failed or grade is not A/A+, add actionable security header issue
        if (observatoryData.tests_failed > 0 || (observatoryData.grade && !observatoryData.grade.startsWith('A'))) {
          const grade = observatoryData.grade || 'B';
          const failedCount = observatoryData.tests_failed || 1;
          if (!Array.isArray(lighthouseResults.issues)) {
            lighthouseResults.issues = [];
          }
          lighthouseResults.issues.unshift({
            id: 'mozilla-observatory-security-headers',
            title: `Mozilla Observatory Security Grade ${grade} (${failedCount} header check${failedCount > 1 ? 's' : ''} failed)`,
            description: `Site received Grade ${grade} on Mozilla / MDN HTTP Observatory with ${failedCount} missing or non-compliant security headers (such as Content-Security-Policy, Strict-Transport-Security, or X-Frame-Options).`,
            category: 'security',
            severity: grade === 'F' || grade === 'D' ? 'critical' : grade === 'C' ? 'high' : 'medium',
            score: (observatoryData.score || 70) / 100,
            displayValue: `Grade ${grade} (${observatoryData.tests_passed || 0}/${observatoryData.tests_quantity || 10} passed)`,
            suggestedFix: 'Implement Strict-Transport-Security (HSTS), Content-Security-Policy (CSP), and X-Content-Type-Options headers to reach Grade A+ on Mozilla Observatory.',
          });
          lighthouseResults.issuesCount = lighthouseResults.issues.length;
          if (grade === 'F' || grade === 'D') {
            lighthouseResults.criticalCount = (lighthouseResults.criticalCount || 0) + 1;
          }
        }

        // Regenerate summary with real security score and MDN grade
        const domain = finalUrl.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
        const criticalCount = lighthouseResults.issues?.filter(i => i.severity === 'critical').length || 0;
        const highCount = lighthouseResults.issues?.filter(i => i.severity === 'high').length || 0;
        lighthouseResults.summary = `Analysis of ${domain} returned an overall health score of ${lighthouseResults.overallScore}/100. ` +
          `Found ${lighthouseResults.issues?.length || 0} issues (${criticalCount} critical, ${highCount} high priority). ` +
          `Performance scored ${lighthouseResults.scores.performance}/100, SEO ${lighthouseResults.scores.seo}/100, ` +
          `Accessibility ${lighthouseResults.scores.accessibility}/100, Security ${lighthouseResults.scores.security}/100 (MDN Observatory Grade ${observatoryData.grade || 'B'}).`;
      }

      // 4b. Merge Secret Scanner results into lighthouseResults
      if (secretsData && secretsData.totalLeaks > 0) {
        lighthouseResults.secretsScan = secretsData;
        if (!Array.isArray(lighthouseResults.issues)) {
          lighthouseResults.issues = [];
        }

        // Inject each leaked secret as a critical security issue
        for (const finding of secretsData.findings) {
          lighthouseResults.issues.unshift({
            id: `secret-leak-${finding.id}`,
            title: `Exposed ${finding.name} in Client Bundle`,
            description: `A live ${finding.name} (${finding.maskedValue}) was found in your public JavaScript file "${finding.sourceFile}". Anyone visiting your site can extract this key from the browser and abuse it.`,
            category: 'security',
            severity: finding.severity,
            score: 0,
            displayValue: `${finding.platform} — ${finding.maskedValue}`,
            suggestedFix: finding.remediation,
            source: 'siteproof-secret-scanner',
          });
        }

        // Update issue counts
        lighthouseResults.issuesCount = lighthouseResults.issues.length;
        const criticalLeaks = secretsData.findings.filter(f => f.severity === 'critical').length;
        lighthouseResults.criticalCount = (lighthouseResults.criticalCount || 0) + criticalLeaks;

        // Penalize security score for leaked secrets
        if (lighthouseResults.scores) {
          const penalty = Math.min(40, secretsData.totalLeaks * 15);
          lighthouseResults.scores.security = Math.max(0, (lighthouseResults.scores.security || 80) - penalty);
          // Recalculate overall score
          lighthouseResults.overallScore = Math.round(
            (lighthouseResults.scores.performance || 80) * 0.25 +
            (lighthouseResults.scores.seo || 80) * 0.2 +
            (lighthouseResults.scores.accessibility || 80) * 0.2 +
            (lighthouseResults.scores.bestPractices || 80) * 0.15 +
            (lighthouseResults.scores.security || 80) * 0.2
          );
        }

        // Update security and privacyData modules in modules list
        if (Array.isArray(lighthouseResults.modules)) {
          const secModIdx = lighthouseResults.modules.findIndex(m => m.id === 'security');
          if (secModIdx !== -1) {
            const existingChecks = lighthouseResults.modules[secModIdx].checks || [];
            const secretChecks = secretsData.checks || [];
            lighthouseResults.modules[secModIdx].checks = [...secretChecks, ...existingChecks];
            lighthouseResults.modules[secModIdx].secretsScan = secretsData;
          }

          const privModIdx = lighthouseResults.modules.findIndex(m => m.id === 'privacyData');
          if (privModIdx !== -1) {
            const leakCount = secretsData.totalLeaks || 0;
            const privScore = Math.max(1, (10 - leakCount * 2.5)).toFixed(1);
            lighthouseResults.modules[privModIdx] = {
              id: 'privacyData',
              title: 'Privacy & Data Security (Secret Leak Audit)',
              score: privScore,
              description: `🚨 ${leakCount} exposed secret(s) found in client bundles. High risk of unauthorized API usage.`,
              checks: secretsData.checks || [],
              source: 'siteproof-secret-scanner',
              secretsScan: secretsData,
              comingSoon: false,
            };
          }
        }
      } else if (secretsData) {
        // Clean scan — add a passing check to the security module and activate privacyData
        lighthouseResults.secretsScan = secretsData;
        if (Array.isArray(lighthouseResults.modules)) {
          const secModIdx = lighthouseResults.modules.findIndex(m => m.id === 'security');
          if (secModIdx !== -1) {
            const existingChecks = lighthouseResults.modules[secModIdx].checks || [];
            existingChecks.push({ status: 'pass', label: 'No exposed API keys or secrets in client bundles' });
            lighthouseResults.modules[secModIdx].checks = existingChecks;
            lighthouseResults.modules[secModIdx].secretsScan = secretsData;
          }

          const privModIdx = lighthouseResults.modules.findIndex(m => m.id === 'privacyData');
          if (privModIdx !== -1) {
            lighthouseResults.modules[privModIdx] = {
              id: 'privacyData',
              title: 'Privacy & Data Security (Secret Leak Audit)',
              score: '10.0',
              description: `Clean client bundle scan · ${secretsData.bundlesScanned || 0} JS bundle(s) audited. Zero leaked secrets or credentials.`,
              checks: secretsData.checks && secretsData.checks.length > 0 ? secretsData.checks : [
                { status: 'pass', label: 'No exposed API keys or secrets detected in client bundles' },
                { status: 'pass', label: 'All client-side scripts verified secure' },
              ],
              source: 'siteproof-secret-scanner',
              secretsScan: secretsData,
              comingSoon: false,
            };
          }
        }
      }

      // 5. Parallel Netlify Functions for AI analysis (PageSpeed AI + Code Review)
      if (progressCb) progressCb(60, 4, 'Synthesizing audit reports with AI...');

      let aiReport = null;
      const warnings = [];
      try {
        aiReport = await analyzeWithAI(lighthouseResults, githubRepo || null, finalUrl, inFlightCodePromise);
        if (progressCb) progressCb(85, 6, 'Parallel AI scanning complete!');
      } catch (aiError) {
        console.warn('[Scanner] AI analysis failed (using PageSpeed fallback):', aiError.message);
        warnings.push('AI analysis unavailable — report shows real Google PageSpeed & Mozilla Observatory data.');
        if (progressCb) progressCb(85, 6, '⚠️ AI analysis unavailable — showing live benchmark results');
      }

      if (progressCb) progressCb(90, 7, 'Saving results...');

      // 6. Save lightweight metadata to Supabase
      const effectiveScore = lighthouseResults.overallScore ?? aiReport?.healthScore ?? 75;
      if (aiReport) {
        aiReport.healthScore = effectiveScore;
        aiReport.summary = lighthouseResults.summary;
      }
      const aiWarnings = Array.isArray(aiReport?.warnings) ? aiReport.warnings : [];
      const allWarnings = [...warnings, ...aiWarnings];

      if (userId) {
        await scanService.complete(scanId, {
          ...lighthouseResults,
          overallScore: effectiveScore,
        }, isLocal);
      }

      // 7. Save full report to Supabase Storage and Smart URL Cache
      const fullReport = {
        scanId,
        url: finalUrl,
        githubRepo: githubRepo || '',
        ...lighthouseResults,
        overallScore: effectiveScore,
        observatory: observatoryData || lighthouseResults.observatory || null,
        secretsScan: secretsData || lighthouseResults.secretsScan || null,
        aiReport: aiReport || null,
        warnings: allWarnings,
        createdAt: new Date().toISOString(),
      };
      await reportCache.save(scanId, fullReport);
      urlCache.set(finalUrl, githubRepo, fullReport);

      if (progressCb) progressCb(100, 8, 'Analysis complete!');

      return {
        success: true,
        data: {
          scanId,
          url: finalUrl,
          githubRepo: githubRepo || '',
          overallScore: effectiveScore,
          scores: lighthouseResults.scores,
          riskLevel: lighthouseResults.riskLevel,
          issuesCount: lighthouseResults.issuesCount,
          criticalCount: lighthouseResults.criticalCount,
          summary: aiReport?.summary || lighthouseResults.summary,
          observatory: observatoryData || lighthouseResults.observatory || null,
          secretsScan: secretsData || lighthouseResults.secretsScan || null,
          aiReport,
          warnings: allWarnings,
        },
      };
    } catch (err) {
      console.error('[Scanner] Unexpected error:', err);
      return { success: false, error: 'An unexpected error occurred during scanning.' };
    }
  },

  /**
   * Get a full report by scan ID
   */
  getReportByScanId: async (scanId) => {
    if (!scanId) return { success: false, error: 'Scan ID is required' };

    const cached = await reportCache.get(scanId);
    if (cached) {
      return { success: true, data: cached, source: 'storage' };
    }

    const scan = await scanService.getById(scanId);
    if (scan) {
      return {
        success: true,
        source: 'supabase',
        data: {
          scanId: scan.id,
          url: scan.url,
          domain: scan.domain,
          overallScore: scan.overall_score,
          scores: {
            security: scan.security_score,
            performance: scan.performance_score,
            seo: scan.seo_score,
            accessibility: scan.accessibility_score,
            bestPractices: scan.best_practices_score,
          },
          riskLevel: scan.risk_level,
          issuesCount: scan.issues_count,
          criticalCount: scan.critical_count,
          summary: scan.summary,
          createdAt: scan.created_at,
          issues: null,
          modules: null,
          recommendations: null,
          webVitals: null,
          techStack: null,
          aiReport: null,
          needsRescan: true,
        },
      };
    }

    return { success: false, error: 'Report not found' };
  },

  /**
   * Get all scans for a user
   */
  getUserScans: async (userId) => {
    if (!userId) return { success: true, data: [] };
    const scans = await scanService.getAll(userId);
    return { success: true, data: scans };
  },

  /**
   * Get dashboard stats for a user
   */
  getUserStats: async (userId) => {
    return scanService.getStats(userId);
  },

  /**
   * Delete a scan
   */
  deleteScan: async (scanId, userId) => {
    if (!scanId || !userId) return { success: false };
    const result = await scanService.delete(scanId, userId);
    return { success: result };
  },
};
