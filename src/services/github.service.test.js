import { describe, it, expect } from 'vitest';
import { parseGithubUrl, isValidGithubRepo } from './github.service';

describe('Github Service', () => {
  describe('parseGithubUrl', () => {
    it('parses a full https github URL', () => {
      expect(parseGithubUrl('https://github.com/facebook/react')).toEqual({
        owner: 'facebook',
        repo: 'react'
      });
    });

    it('parses a full http github URL', () => {
      expect(parseGithubUrl('http://github.com/facebook/react')).toEqual({
        owner: 'facebook',
        repo: 'react'
      });
    });

    it('parses a www github URL', () => {
      expect(parseGithubUrl('https://www.github.com/facebook/react')).toEqual({
        owner: 'facebook',
        repo: 'react'
      });
    });

    it('removes trailing .git', () => {
      expect(parseGithubUrl('https://github.com/facebook/react.git')).toEqual({
        owner: 'facebook',
        repo: 'react'
      });
    });

    it('parses owner/repo short format', () => {
      expect(parseGithubUrl('facebook/react')).toEqual({
        owner: 'facebook',
        repo: 'react'
      });
    });

    it('returns null for invalid URLs', () => {
      expect(parseGithubUrl('https://google.com')).toBeNull();
      expect(parseGithubUrl('invalid-string')).toBeNull();
      expect(parseGithubUrl(null)).toBeNull();
      expect(parseGithubUrl(123)).toBeNull();
    });
  });

  describe('isValidGithubRepo', () => {
    it('returns true for valid repos', () => {
      expect(isValidGithubRepo('https://github.com/owner/repo')).toBe(true);
      expect(isValidGithubRepo('owner/repo')).toBe(true);
    });

    it('returns false for invalid repos', () => {
      expect(isValidGithubRepo('invalid-url')).toBe(false);
      expect(isValidGithubRepo('')).toBe(false);
    });
  });
});
