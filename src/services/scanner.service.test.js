import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scannerService } from './scanner.service';
import { runLighthouseAnalysis } from './lighthouse.service';
import { analyzeWithAI, fetchCodeAnalysis } from './nvidia.service';
import { fetchObservatoryScan } from './observatory.service';
import { scanService, reportCache, urlCache } from './database.service';

vi.mock('./lighthouse.service', () => ({
  runLighthouseAnalysis: vi.fn()
}));

vi.mock('./observatory.service', () => ({
  fetchObservatoryScan: vi.fn()
}));

vi.mock('./nvidia.service', () => ({
  analyzeWithAI: vi.fn(),
  fetchCodeAnalysis: vi.fn()
}));

vi.mock('./database.service', () => ({
  scanService: {
    create: vi.fn(),
    complete: vi.fn(),
    fail: vi.fn()
  },
  reportCache: {
    save: vi.fn()
  },
  urlCache: {
    get: vi.fn(() => null),
    set: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn()
  }
}));

describe('Scanner Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchCodeAnalysis.mockResolvedValue({ status: 'ok' });
    fetchObservatoryScan.mockResolvedValue({
      grade: 'B',
      score: 78,
      tests_passed: 8,
      tests_failed: 2,
      tests_quantity: 10,
      details_url: 'https://developer.mozilla.org/en-US/observatory/analyze?host=example.com',
      checks: [{ status: 'pass', label: 'MDN Observatory Grade: B (78/100)' }],
    });
    urlCache.get.mockReturnValue(null);
  });

  it('runs full scan successfully with AI and Github in parallel', async () => {
    // Mocks
    scanService.create.mockResolvedValueOnce({ id: 'scan-123', _local: false });
    
    const mockLighthouseResults = { overallScore: 80, scores: {}, riskLevel: 'Low', issuesCount: 1, criticalCount: 0, summary: 'Good' };
    runLighthouseAnalysis.mockResolvedValueOnce(mockLighthouseResults);
    
    const mockAiReport = { healthScore: 85, summary: 'AI summary', warnings: [] };
    analyzeWithAI.mockResolvedValueOnce(mockAiReport);

    const onProgress = vi.fn();

    const result = await scannerService.analyzeSite(
      'https://example.com',
      'owner/repo',
      'user-123',
      onProgress
    );

    // Verify validators and logic
    expect(result.success).toBe(true);
    expect(result.data.scanId).toBe('scan-123');
    expect(result.data.overallScore).toBe(80); // Uses computed overallScore
    
    // Verify services called
    expect(scanService.create).toHaveBeenCalledWith('user-123', 'https://example.com');
    expect(fetchCodeAnalysis).toHaveBeenCalledWith('https://github.com/owner/repo', 'https://example.com');
    expect(runLighthouseAnalysis).toHaveBeenCalledWith('https://example.com', 'mobile');
    expect(analyzeWithAI).toHaveBeenCalledWith(mockLighthouseResults, 'https://github.com/owner/repo', 'https://example.com', expect.any(Promise));
    
    expect(scanService.complete).toHaveBeenCalledWith('scan-123', expect.objectContaining({ overallScore: 80 }), false);
    expect(reportCache.save).toHaveBeenCalled();
    expect(urlCache.set).toHaveBeenCalled();
    
    // Verify progress callbacks
    expect(onProgress).toHaveBeenCalled();
  });

  it('returns cached audit immediately on cache hit', async () => {
    const mockCachedReport = {
      scanId: 'cached-scan-999',
      url: 'https://example.com',
      overallScore: 94,
      scores: {},
      riskLevel: 'Low',
      issuesCount: 0,
      criticalCount: 0,
      summary: 'Cached summary',
      cacheAgeMinutes: 15,
      cachedAt: new Date().toISOString()
    };
    urlCache.get.mockReturnValueOnce(mockCachedReport);

    const onProgress = vi.fn();
    const result = await scannerService.analyzeSite('https://example.com', null, 'user-123', onProgress);

    expect(result.success).toBe(true);
    expect(result.isCached).toBe(true);
    expect(result.data.scanId).toBe('cached-scan-999');
    expect(result.data.overallScore).toBe(94);
    expect(runLighthouseAnalysis).not.toHaveBeenCalled();
    expect(scanService.create).not.toHaveBeenCalled();
  });

  it('bypasses cache when forceRefresh option is true', async () => {
    scanService.create.mockResolvedValueOnce({ id: 'fresh-scan-1', _local: false });
    runLighthouseAnalysis.mockResolvedValueOnce({ overallScore: 88, scores: {}, riskLevel: 'Low', issuesCount: 0, criticalCount: 0 });
    analyzeWithAI.mockResolvedValueOnce({ healthScore: 88, summary: 'Fresh scan', warnings: [] });

    const result = await scannerService.analyzeSite(
      'https://example.com',
      null,
      'user-123',
      vi.fn(),
      { forceRefresh: true }
    );

    expect(result.success).toBe(true);
    expect(urlCache.get).not.toHaveBeenCalled();
    expect(runLighthouseAnalysis).toHaveBeenCalled();
  });

  it('handles invalid URLs gracefully', async () => {
    const result = await scannerService.analyzeSite('not-a-url', null, 'user-123', vi.fn());
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    
    expect(scanService.create).not.toHaveBeenCalled();
    expect(runLighthouseAnalysis).not.toHaveBeenCalled();
  });

  it('handles Lighthouse failure gracefully', async () => {
    scanService.create.mockResolvedValueOnce({ id: 'scan-123', _local: false });
    runLighthouseAnalysis.mockRejectedValueOnce(new Error('Lighthouse timeout'));

    const result = await scannerService.analyzeSite('https://example.com', 'user-123', vi.fn());

    expect(result.success).toBe(false);
    expect(result.error).toBe('Lighthouse timeout');
    
    expect(scanService.fail).toHaveBeenCalledWith('scan-123', 'Lighthouse timeout', false);
    expect(analyzeWithAI).not.toHaveBeenCalled();
  });

  it('handles AI failure gracefully (falls back to lighthouse scores)', async () => {
    scanService.create.mockResolvedValueOnce({ id: 'scan-123', _local: false });
    
    const mockLighthouseResults = { overallScore: 80, scores: {}, riskLevel: 'Low', issuesCount: 1, criticalCount: 0, summary: 'Good' };
    runLighthouseAnalysis.mockResolvedValueOnce(mockLighthouseResults);
    
    analyzeWithAI.mockRejectedValueOnce(new Error('AI failed'));

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await scannerService.analyzeSite('https://example.com', 'user-123', vi.fn());

    expect(result.success).toBe(true);
    expect(result.data.overallScore).toBe(80); // Fallback to lighthouse score
    expect(result.data.warnings).toContain('AI analysis unavailable — report shows real Google PageSpeed & Mozilla Observatory data.');
    
    consoleSpy.mockRestore();
  });

  it('incorporates live Mozilla Observatory results into security score and report', async () => {
    scanService.create.mockResolvedValueOnce({ id: 'scan-sec-1', _local: true });
    
    const mockLighthouseResults = {
      overallScore: 70,
      scores: { performance: 80, seo: 80, accessibility: 80, bestPractices: 80, security: 50 },
      modules: [{ id: 'security', title: 'Security', score: '5.0', checks: [] }],
      issues: [],
      issuesCount: 0,
      criticalCount: 0,
      summary: 'Initial summary',
    };
    runLighthouseAnalysis.mockResolvedValueOnce(mockLighthouseResults);
    analyzeWithAI.mockResolvedValueOnce({ healthScore: 82, summary: 'AI summary', warnings: [] });

    fetchObservatoryScan.mockResolvedValueOnce({
      grade: 'A+',
      score: 100,
      tests_passed: 10,
      tests_failed: 0,
      tests_quantity: 10,
      details_url: 'https://developer.mozilla.org/en-US/observatory/analyze?host=example.com',
      checks: [{ status: 'pass', label: 'MDN Observatory Grade: A+ (100/100)' }],
    });

    const result = await scannerService.analyzeSite('https://example.com');

    expect(result.success).toBe(true);
    expect(result.data.observatory).toBeDefined();
    expect(result.data.observatory.grade).toBe('A+');
    expect(result.data.observatory.score).toBe(100);
    expect(result.data.scores.security).toBe(100);
  });
});
