/**
 * Scanner Service — Real Website Analysis
 *
 * Orchestrates: Lighthouse API → Score calculation → Supabase save
 * Full report details stored in browser cache (NOT Supabase).
 */
import { runLighthouseAnalysis } from './lighthouse.service';
import { scanService, websiteService, reportCache } from './database.service';
import { sanitizeUrl, isValidUrl } from '../utils/validators';

export const scannerService = {
  /**
   * Run a real scan on a website URL
   * @param {string} url - URL to scan
   * @param {string} userId - Authenticated user ID
   * @param {function} onProgress - Progress callback (percent, stageIndex, message)
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  analyzeSite: async (url, userId, onProgress) => {
    try {
      // 1. Validate URL
      const formattedUrl = sanitizeUrl(url);
      const urlCheck = isValidUrl(formattedUrl);
      if (!urlCheck.valid) {
        return { success: false, error: urlCheck.error };
      }
      const finalUrl = urlCheck.url || formattedUrl;

      if (onProgress) onProgress(5, 0, 'Validating URL...');

      // 2. Create scan record in Supabase
      let scan = null;
      if (userId) {
        scan = await scanService.create(userId, finalUrl);
      }
      const scanId = scan?.id || crypto.randomUUID();
      const isLocal = !scan || scan._local;

      if (onProgress) onProgress(10, 1, 'Connecting to Google Lighthouse...');

      // 3. Run real Lighthouse analysis
      let lighthouseResults;
      try {
        if (onProgress) onProgress(20, 2, 'Running performance analysis...');
        lighthouseResults = await runLighthouseAnalysis(finalUrl, 'mobile');
        if (onProgress) onProgress(80, 5, 'Processing results...');
      } catch (lighthouseError) {
        // Mark scan as failed
        if (userId && !isLocal) {
          await scanService.fail(scanId, lighthouseError.message, isLocal);
        }
        return {
          success: false,
          error: lighthouseError.message || 'Failed to analyze website. Make sure the URL is publicly accessible.',
        };
      }

      if (onProgress) onProgress(90, 6, 'Saving results...');

      // 4. Save lightweight metadata to Supabase
      if (userId) {
        await scanService.complete(scanId, lighthouseResults, isLocal);
      }

      // 5. Save full report to browser cache (NOT Supabase)
      const fullReport = {
        scanId,
        url: finalUrl,
        ...lighthouseResults,
        createdAt: new Date().toISOString(),
      };
      reportCache.save(scanId, fullReport);

      if (onProgress) onProgress(100, 7, 'Analysis complete!');

      return {
        success: true,
        data: {
          scanId,
          url: finalUrl,
          overallScore: lighthouseResults.overallScore,
          scores: lighthouseResults.scores,
          riskLevel: lighthouseResults.riskLevel,
          issuesCount: lighthouseResults.issuesCount,
          criticalCount: lighthouseResults.criticalCount,
          summary: lighthouseResults.summary,
        },
      };
    } catch (err) {
      console.error('[Scanner] Unexpected error:', err);
      return { success: false, error: 'An unexpected error occurred during scanning.' };
    }
  },

  /**
   * Get a full report by scan ID
   * First checks browser cache, then Supabase for metadata
   */
  getReportByScanId: async (scanId) => {
    if (!scanId) return { success: false, error: 'Scan ID is required' };

    // 1. Check browser cache for full report
    const cached = reportCache.get(scanId);
    if (cached) {
      return { success: true, data: cached, source: 'cache' };
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
          needsRescan: true, // Flag: full details require re-scan
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
