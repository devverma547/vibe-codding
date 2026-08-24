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
 *
 *   Netlify Functions (server-side):
 *     5. Execute in parallel (cuts scan time in half, avoids 20s timeouts)
 *     6. Call NVIDIA NIM AI (key never exposed to browser)
 *
 *   Frontend (continued):
 *     7. Merge parallel JSON reports into single 6-module audit report
 *     8. Save report to Supabase + cache
 *     9. Return enriched report data
 */
import { runLighthouseAnalysis } from './lighthouse.service';
import { analyzeWithAI, fetchCodeAnalysis } from './nvidia.service';
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

      // 4. Strategy 1: Parallel Execution Engine
      //    Concurrently dispatch GitHub extraction & Code Quality at t=0 alongside PageSpeed!
      const hasGithub = Boolean(githubRepo && isValidGithubRepo(githubRepo).valid);
      const inFlightCodePromise = hasGithub ? fetchCodeAnalysis(githubRepo, finalUrl) : null;

      let lighthouseResults;
      try {
        if (progressCb) progressCb(15, 2, hasGithub
          ? 'Running parallel scans: Google PageSpeed + GitHub source code extraction...'
          : 'Running Google PageSpeed Insights audit...');
        lighthouseResults = await runLighthouseAnalysis(finalUrl, 'mobile');
        if (progressCb) progressCb(55, 3, 'PageSpeed analysis complete!');
      } catch (lighthouseError) {
        if (userId && !isLocal) {
          await scanService.fail(scanId, lighthouseError.message, isLocal);
        }
        return {
          success: false,
          error: lighthouseError.message || 'Failed to analyze website. Please check the URL is correct and the site is publicly accessible.',
        };
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
        warnings.push('AI analysis unavailable — report shows real Google PageSpeed data only.');
        if (progressCb) progressCb(85, 6, '⚠️ AI analysis unavailable — showing PageSpeed results');
      }

      if (progressCb) progressCb(90, 7, 'Saving results...');

      // 6. Save lightweight metadata to Supabase
      const effectiveScore = aiReport?.healthScore ?? lighthouseResults.overallScore;
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
