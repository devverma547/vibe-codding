/**
 * Netlify Serverless Function: /api/analyze
 *
 * SECURE server-side function. Supports legacy single requests as well as
 * action-based dispatching ('pagespeed' or 'code').
 *
 * For parallel scanning, frontend invokes:
 *   - /.netlify/functions/analyze-pagespeed
 *   - /.netlify/functions/analyze-code
 */

import { handler as pagespeedHandler } from './analyze-pagespeed.mjs';
import { handler as codeHandler } from './analyze-code.mjs';

export const handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const { action, pageSpeedData, githubRepoUrl, url } = payload;

    // Dispatch based on action parameter if provided
    if (action === 'pagespeed') {
      return await pagespeedHandler(event);
    }
    if (action === 'code') {
      return await codeHandler(event);
    }

    // Default legacy behavior: execute both handlers sequentially if requested on single endpoint
    if (!pageSpeedData || !url) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields: pageSpeedData, url' }),
      };
    }

    const pageSpeedRes = await pagespeedHandler(event);
    let pageSpeedReport = {};
    if (pageSpeedRes.statusCode === 200) {
      pageSpeedReport = JSON.parse(pageSpeedRes.body);
    }

    let codeReport = null;
    if (githubRepoUrl) {
      try {
        const codeRes = await codeHandler(event);
        if (codeRes.statusCode === 200) {
          codeReport = JSON.parse(codeRes.body);
        }
      } catch (err) {
        console.warn('[Legacy Analyze] Code analysis failed:', err.message);
      }
    }

    // Merge into combined report
    const mergedBreakdown = (pageSpeedReport.auditBreakdown || []).filter(
      (m) => String(m.id || '').toLowerCase() !== 'code-quality'
    );
    const codeModule = codeReport?.auditBreakdown?.[0] || {
      id: 'code-quality',
      category: 'Code Quality',
      title: 'Code Quality',
      score: '0.0',
      description: githubRepoUrl
        ? `GitHub repo (${githubRepoUrl}) linked, but code analysis was skipped or failed.`
        : 'No source code review was available.',
      source: 'github-code-review',
      checks: [],
    };
    mergedBreakdown.push(codeModule);

    const mergedFixPrompts = [
      ...(pageSpeedReport.fixPrompts || []),
      ...(codeReport?.fixPrompts || []),
    ];

    const warnings = [
      ...(pageSpeedReport.warnings || []),
      ...(codeReport?.warnings || []),
    ];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ...pageSpeedReport,
        auditBreakdown: mergedBreakdown,
        fixPrompts: mergedFixPrompts,
        warnings,
      }),
    };
  } catch (err) {
    console.error('[Analyze] Unexpected error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', message: err.message }),
    };
  }
};
