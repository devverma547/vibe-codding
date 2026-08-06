/**
 * GitHub Service — Client-Side Utilities
 *
 * NOTE: The actual GitHub code extraction happens SERVER-SIDE in the
 * Netlify Function (netlify/functions/analyze.mjs) where the GITHUB_TOKEN
 * is secure and rate limits are 5,000 req/hr instead of 60 req/hr.
 *
 * This file only exports client-side utility functions for URL parsing
 * and validation — no API calls are made from the browser.
 */

/**
 * Parse a GitHub URL or owner/repo string into { owner, repo }
 * @param {string} input - GitHub URL or "owner/repo" string
 * @returns {{ owner: string, repo: string } | null}
 */
export function parseGithubUrl(input) {
  if (!input || typeof input !== 'string') return null;

  const trimmed = input.trim();

  // Full URL: https://github.com/owner/repo/...
  const urlMatch = trimmed.match(
    /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)/
  );
  if (urlMatch) {
    return { owner: urlMatch[1], repo: urlMatch[2].replace(/\.git$/, '') };
  }

  // Short form: owner/repo
  const shortMatch = trimmed.match(/^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/);
  if (shortMatch) {
    return { owner: shortMatch[1], repo: shortMatch[2] };
  }

  return null;
}

/**
 * Validate a GitHub repository URL
 * @param {string} input - URL to validate
 * @returns {boolean}
 */
export function isValidGithubRepo(input) {
  return parseGithubUrl(input) !== null;
}
