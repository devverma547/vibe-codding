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
import { analyzeWithAI } from './nvidia.service';
import { scanService, reportCache } from './database.service';
import { sanitizeUrl, isValidUrl, sanitizeGithubRepo, isValidGithubRepo } from '../utils/validators';

export const scannerService = {
  /**
   * Run a full AI-powered scan on a website URL and optional GitHub repo
   * @param {string} url - URL to scan
   * @param {string} [githubRepoOrUserId] - GitHub repo URL, owner/repo, or legacy user ID
   * @param {string|function} [userIdOrProgress] - User ID or progress callback
   * @param {function} [onProgress] - Progress callback(percent, step, message)
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  analyzeSite: async (url, githubRepoOrUserId, userIdOrProgress, onProgress) => {
    try {
      let githubRepo = '';
      let userId = null;
      let progressCb = onProgress;

      if (typeof githubRepoOrUserId === 'function') {
        progressCb = githubRepoOrUserId;
      } else if (typeof githubRepoOrUserId === 'string' && isValidGithubRepo(githubRepoOrUserId).valid) {
        githubRepo = sanitizeGithubRepo(githubRepoOrUserId);
        userId = typeof userIdOrProgress === 'string' ? userIdOrProgress : null;
        if (typeof userIdOrProgress === 'function') progressCb = userIdOrProgress;
      } else {
        userId = typeof githubRepoOrUserId === 'string' ? githubRepoOrUserId : null;
        if (typeof userIdOrProgress === 'function') progressCb = userIdOrProgress;
      }

      // 1. Validate URL
      const formattedUrl = sanitizeUrl(url);
      const urlCheck = isValidUrl(formattedUrl);
      if (!urlCheck.valid) {
        return { success: false, error: urlCheck.error };
      }
      const finalUrl = urlCheck.url || formattedUrl;

      if (progressCb) progressCb(5, 0, 'Validating URL...');

      // 2. Create scan record in Supabase
      let scan = null;
      if (userId) {
        scan = await scanService.create(userId, finalUrl);
      }
      const scanId = scan?.id || crypto.randomUUID();
      const isLocal = !scan || scan._local;

      if (progressCb) progressCb(10, 1, 'Connecting to Google PageSpeed API...');

      // 3. Run PageSpeed Insights (CLIENT-SIDE — public API key, no security risk)
      let lighthouseResults;
      try {
        if (progressCb) progressCb(15, 2, 'Running Google PageSpeed Insights audit...');
        lighthouseResults = await runLighthouseAnalysis(finalUrl, 'mobile');
        if (progressCb) progressCb(45, 3, 'PageSpeed analysis complete!');
      } catch (lighthouseError) {
        if (userId && !isLocal) {
          await scanService.fail(scanId, lighthouseError.message, isLocal);
        }
        return {
          success: false,
          error: lighthouseError.message || 'Failed to analyze website. Make sure the URL is publicly accessible.',
        };
      }

      // 4. Parallel Netlify Functions for AI analysis (SERVER-SIDE)
      //    Calls analyze-pagespeed.mjs and analyze-code.mjs in parallel via Promise.allSettled()
      if (progressCb) progressCb(50, 4, githubRepo
        ? 'Running parallel AI scanning: PageSpeed + GitHub code extraction...'
        : 'Running AI analysis (server-side)...');

      let aiReport = null;
      const warnings = [];
      try {
        aiReport = await analyzeWithAI(lighthouseResults, githubRepo || null, finalUrl);
        if (progressCb) progressCb(85, 6, 'Parallel AI scanning complete!');
      } catch (aiError) {
        console.warn('[Scanner] AI analysis failed (using PageSpeed fallback):', aiError.message);
        warnings.push('AI analysis unavailable — report shows real Google PageSpeed data only.');
        if (progressCb) progressCb(85, 6, '⚠️ AI analysis unavailable — showing PageSpeed results');
      }

      if (progressCb) progressCb(90, 7, 'Saving results...');

      // 5. Save lightweight metadata to Supabase
      const effectiveScore = aiReport?.healthScore ?? lighthouseResults.overallScore;
      const aiWarnings = Array.isArray(aiReport?.warnings) ? aiReport.warnings : [];
      const allWarnings = [...warnings, ...aiWarnings];

      if (userId) {
        await scanService.complete(scanId, {
          ...lighthouseResults,
          overallScore: effectiveScore,
        }, isLocal);
      }

      // 6. Save full report to Supabase Storage / cache
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
