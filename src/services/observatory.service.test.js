import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  extractHostFromUrl,
  getObservatoryGradeColor,
  fetchObservatoryScan,
  buildObservatoryChecks,
} from './observatory.service';

describe('Mozilla Observatory Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('extractHostFromUrl', () => {
    it('extracts host from full URL with protocol and path', () => {
      expect(extractHostFromUrl('https://example.com/some/path?query=1')).toBe('example.com');
    });

    it('extracts host from domain without protocol', () => {
      expect(extractHostFromUrl('subdomain.example.org/page')).toBe('subdomain.example.org');
    });

    it('handles uppercase and ports', () => {
      expect(extractHostFromUrl('HTTP://SITE.IO:8080/')).toBe('site.io');
    });

    it('returns empty string for null or non-string', () => {
      expect(extractHostFromUrl(null)).toBe('');
      expect(extractHostFromUrl('')).toBe('');
    });
  });

  describe('getObservatoryGradeColor', () => {
    it('returns emerald styling for A grades', () => {
      const colorA = getObservatoryGradeColor('A+');
      expect(colorA.name).toBe('emerald');
      expect(colorA.color).toBe('#10B981');

      const colorAFlat = getObservatoryGradeColor('A');
      expect(colorAFlat.name).toBe('emerald');
    });

    it('returns blue styling for B grades', () => {
      const colorB = getObservatoryGradeColor('B');
      expect(colorB.name).toBe('blue');
      expect(colorB.color).toBe('#3B82F6');
    });

    it('returns amber styling for C grades', () => {
      const colorC = getObservatoryGradeColor('C');
      expect(colorC.name).toBe('amber');
    });

    it('returns red styling for D and F grades', () => {
      const colorD = getObservatoryGradeColor('D');
      expect(colorD.name).toBe('red');

      const colorF = getObservatoryGradeColor('F');
      expect(colorF.name).toBe('red');
    });
  });

  describe('buildObservatoryChecks', () => {
    it('builds structured checks reflecting grade, test counts, and HTTPS', () => {
      const mockData = {
        grade: 'A+',
        score: 100,
        tests_passed: 10,
        tests_failed: 0,
        tests_quantity: 10,
      };

      const checks = buildObservatoryChecks(mockData, true);
      expect(checks).toHaveLength(5);
      expect(checks[0].status).toBe('pass');
      expect(checks[0].label).toContain('MDN Observatory Grade: A+');
      expect(checks[1].status).toBe('pass');
      expect(checks[1].label).toContain('10/10 tests passed');
      expect(checks[2].status).toBe('pass');
    });

    it('marks warnings and failures properly for lower grade and HTTP', () => {
      const mockData = {
        grade: 'F',
        score: 25,
        tests_passed: 3,
        tests_failed: 7,
        tests_quantity: 10,
      };

      const checks = buildObservatoryChecks(mockData, false);
      expect(checks[0].status).toBe('fail');
      expect(checks[2].status).toBe('fail');
      expect(checks[2].label).toContain('Missing HTTPS');
    });
  });

  describe('fetchObservatoryScan', () => {
    it('successfully fetches and parses live Observatory API response', async () => {
      const mockApiResponse = {
        id: 116927207,
        details_url: 'https://developer.mozilla.org/en-US/observatory/analyze?host=mozilla.org',
        algorithm_version: 5,
        scanned_at: '2026-08-25T17:23:30.935Z',
        error: null,
        grade: 'B',
        score: 75,
        status_code: 200,
        tests_failed: 2,
        tests_passed: 8,
        tests_quantity: 10,
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      const result = await fetchObservatoryScan('https://mozilla.org');
      expect(result).toBeDefined();
      expect(result.host).toBe('mozilla.org');
      expect(result.grade).toBe('B');
      expect(result.score).toBe(75);
      expect(result.tests_passed).toBe(8);
      expect(result.tests_failed).toBe(2);
      expect(result.tests_quantity).toBe(10);
      expect(result.details_url).toContain('observatory/analyze?host=mozilla.org');
      expect(result.isLive).toBe(true);
      expect(result.source).toBe('mozilla-observatory');
    });

    it('falls back gracefully when API returns error or fails', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Direct API fails with 500
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });
      // Netlify proxy also fails
      global.fetch.mockRejectedValueOnce(new Error('Proxy connection refused'));

      const result = await fetchObservatoryScan('https://example.com');

      expect(result).toBeDefined();
      expect(result.host).toBe('example.com');
      expect(result.isFallback).toBe(true);
      expect(result.score).toBe(75);
      expect(result.grade).toBe('B');
      expect(result.checks).toBeDefined();

      consoleSpy.mockRestore();
    });
  });
});
