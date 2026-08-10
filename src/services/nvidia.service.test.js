import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeWithAI } from './nvidia.service';
import * as validators from '../utils/validators';

vi.mock('../utils/validators', () => ({
  isValidGithubRepo: vi.fn()
}));

describe('NVIDIA AI Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('runs both PageSpeed and Code Analysis when github URL is valid', async () => {
    validators.isValidGithubRepo.mockReturnValue({ valid: true });

    // Mock both fetch calls
    global.fetch.mockImplementation(async (url) => {
      if (url === '/.netlify/functions/analyze-pagespeed') {
        return { ok: true, json: async () => ({ fixPrompts: [{ title: 'Fix A', priority: 'HIGH' }] }) };
      }
      if (url === '/.netlify/functions/analyze-code') {
        return { ok: true, json: async () => ({ fixPrompts: [{ title: 'Fix B', priority: 'CRITICAL' }] }) };
      }
    });

    const result = await analyzeWithAI({}, 'https://github.com/test/repo', 'https://test.com');

    // It should have both prompts, sorted by priority (CRITICAL before HIGH)
    expect(result.fixPrompts).toHaveLength(2);
    expect(result.fixPrompts[0].title).toBe('Fix B'); // CRITICAL
    expect(result.fixPrompts[1].title).toBe('Fix A'); // HIGH

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenCalledWith('/.netlify/functions/analyze-pagespeed', expect.any(Object));
    expect(global.fetch).toHaveBeenCalledWith('/.netlify/functions/analyze-code', expect.any(Object));
  });

  it('skips code analysis if github URL is invalid or missing', async () => {
    validators.isValidGithubRepo.mockReturnValue({ valid: false });

    global.fetch.mockImplementation(async (url) => {
      if (url === '/.netlify/functions/analyze-pagespeed') {
        return { ok: true, json: async () => ({ fixPrompts: [{ title: 'Fix A', priority: 'HIGH' }] }) };
      }
    });

    const result = await analyzeWithAI({}, null, 'https://test.com');

    expect(result.fixPrompts).toHaveLength(1);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith('/.netlify/functions/analyze-pagespeed', expect.any(Object));
  });

  it('uses fallback if PageSpeed fetch fails', async () => {
    validators.isValidGithubRepo.mockReturnValue({ valid: false });
    
    global.fetch.mockRejectedValueOnce(new Error('Network error'));
    
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Provide some mock pageSpeedData to build the fallback report
    const mockPageSpeedData = {
      issues: [{ title: 'Issue 1', severity: 'high', suggestedFix: 'Fix it' }]
    };

    const result = await analyzeWithAI(mockPageSpeedData, null, 'https://test.com');

    expect(result).toBeDefined();
    expect(result.source).toBe('pagespeed-fallback');
    expect(result.fixPrompts.length).toBeGreaterThan(0);
    
    consoleSpy.mockRestore();
  });
});
