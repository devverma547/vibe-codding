/**
 * Scanner Service — Full AI Audit Pipeline
 *
 * ARCHITECTURE (secure):
 *   Frontend (browser):
 *     1. Validate URL
 *     2. Create scan record in Supabase
 *     3. Run PageSpeed Insights (client-side, public API key)
 *     4. Send results to Netlify Function
 *
 *   Netlify Function (server-side):
 *     5. Extract GitHub code (with GITHUB_TOKEN, 5,000 req/hr)
 *     6. Call NVIDIA NIM AI (key never exposed to browser)
 *     7. Return AI report
 *
 *   Frontend (continued):
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

      // 4. Send to Netlify Function for AI analysis (SERVER-SIDE — keys are secure)
      //    The function handles:
      //    - GitHub code extraction (with GITHUB_TOKEN for 5,000 req/hr)
      //    - NVIDIA NIM AI call (API key never sent to browser)
      //    - Robust JSON parsing of AI response
      if (progressCb) progressCb(50, 4, githubRepo
        ? 'Extracting GitHub code & running AI analysis (server-side)...'
        : 'Running AI analysis (server-side)...');

      let aiReport = null;
      const warnings = [];
      try {
        // analyzeWithAI() calls /.netlify/functions/analyze
        // which does GitHub extraction + NVIDIA AI call on the server
        aiReport = await analyzeWithAI(lighthouseResults, githubRepo || null, finalUrl);
        if (progressCb) progressCb(85, 6, 'AI analysis complete!');
      } catch (aiError) {
        console.warn('[Scanner] AI analysis failed (using PageSpeed fallback):', aiError.message);
        warnings.push('AI analysis unavailable — report shows real Google PageSpeed data only.');
        if (progressCb) progressCb(85, 6, '⚠️ AI analysis unavailable — showing PageSpeed results');
        // Non-fatal: report will still have genuine PageSpeed data
      }

      if (progressCb) progressCb(90, 7, 'Saving results...');

      // 5. Save lightweight metadata to Supabase
      const effectiveScore = aiReport?.healthScore ?? lighthouseResults.overallScore;

      if (userId) {
        await scanService.complete(scanId, {
          ...lighthouseResults,
          overallScore: effectiveScore,
        }, isLocal);
      }

      // 6. Save full report to Supabase Storage
      const fullReport = {
        scanId,
        url: finalUrl,
        githubRepo: githubRepo || '',
        ...lighthouseResults,
        overallScore: effectiveScore,
        aiReport: aiReport || null,
        warnings,
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
          warnings,
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

    // 1. Check Supabase storage for full report
    const cached = await reportCache.get(scanId);
    if (cached) {
      return { success: true, data: cached, source: 'storage' };
    }

    // 2. Check Supabase for scan metadata (scores only)
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
          // These are NOT available from Supabase (only scores stored there)
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
