import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runLighthouseAnalysis } from './lighthouse.service';

describe('Lighthouse Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('runs synthetic analysis when fetch fails', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));
    
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await runLighthouseAnalysis('https://example.com');

    expect(result).toBeDefined();
    expect(result.isSynthetic).toBe(true);
    expect(result.fallbackReason).toBe('Network Request Fallback');
    expect(result.overallScore).toBeDefined();
    
    consoleSpy.mockRestore();
  });

  it('runs synthetic analysis when response is not ok', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 429
    });
    
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await runLighthouseAnalysis('https://example.com');

    expect(result).toBeDefined();
    expect(result.isSynthetic).toBe(true);
    expect(result.fallbackReason).toBe('Google PageSpeed Rate Limit Reached');
    
    consoleSpy.mockRestore();
  });

  it('parses actual lighthouse results when fetch is successful', async () => {
    // We provide a minimal mock of the lighthouse API response
    const mockApiResponse = {
      lighthouseResult: {
        categories: {
          performance: { score: 0.9 },
          seo: { score: 0.8 },
          accessibility: { score: 0.85 },
          'best-practices': { score: 0.95 }
        },
        audits: {
          'is-on-https': { score: 1 },
          metrics: { details: { items: [{ lcp: 2000, fcp: 1000, cls: 0.05, interactive: 3000 }] } }
        }
      }
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse
    });

    const result = await runLighthouseAnalysis('https://example.com');

    // Just verify it processed successfully without throwing.
    // The parsing logic adds security, privacyData etc (from synthetic logic)
    expect(result).toBeDefined();
    expect(result.isSynthetic).toBeUndefined(); // Real parse doesn't set isSynthetic
    expect(result.scores.performance).toBe(90);
    expect(result.scores.seo).toBe(80);
    expect(result.scores.accessibility).toBe(85);
    expect(result.scores.bestPractices).toBe(95);
  });
});
