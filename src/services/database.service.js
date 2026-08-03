/**
 * Database Service — Supabase + localStorage hybrid
 * 
 * STORAGE STRATEGY (free-tier optimized):
 * - Supabase: scan metadata only (scores, URL, date) — ~300 bytes/scan
 * - localStorage: full report details (issues, recommendations) — temporary
 * - PDFs: generated client-side, never stored on server
 * 
 * This keeps Supabase under 3MB even with 10,000 scans.
 */
import { supabase } from '../config/supabase';

// ================================================================
// REPORT CACHE — stores full report details in Supabase Storage
// ================================================================

export const reportCache = {
  async save(scanId, reportData) {
    try {
      const fileName = `${scanId}.json`;
      const { error } = await supabase.storage
        .from('reports')
        .upload(fileName, JSON.stringify(reportData), {
          contentType: 'application/json',
          upsert: true,
        });
      if (error) throw error;
    } catch (e) {
      console.warn('[ReportCache] Failed to save to Supabase:', e.message);
    }
  },

  async get(scanId) {
    try {
      const fileName = `${scanId}.json`;
      const { data, error } = await supabase.storage
        .from('reports')
        .download(fileName);
      
      if (error || !data) return null;
      
      const text = await data.text();
      return JSON.parse(text);
    } catch {
      return null;
    }
  },

  async remove(scanId) {
    try {
      const fileName = `${scanId}.json`;
      await supabase.storage.from('reports').remove([fileName]);
    } catch { /* ignore */ }
  }
};

// ================================================================
// WEBSITE SERVICE — Supabase
// ================================================================
export const websiteService = {
  async getAll(userId) {
    if (!userId) return [];
    try {
      const { data, error } = await supabase
        .from('websites')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('[WebsiteService] getAll failed:', err.message);
      return [];
    }
  },

  async create(userId, url) {
    if (!userId || !url) return null;
    const domain = url.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    try {
      const { data, error } = await supabase
        .from('websites')
        .insert([{
          user_id: userId,
          url,
          domain,
          name: domain,
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('[WebsiteService] create failed:', err.message);
      return null;
    }
  },

  async updateLastScan(websiteId, score) {
    if (!websiteId) return;
    try {
      await supabase
        .from('websites')
        .update({
          last_score: score,
          last_scanned_at: new Date().toISOString(),
          scan_count: supabase.rpc ? undefined : 1, // increment handled below
        })
        .eq('id', websiteId);
      // Increment scan_count
      await supabase.rpc('increment_scan_count', { website_row_id: websiteId }).catch(() => {
        // If RPC doesn't exist, just update directly
        supabase
          .from('websites')
          .select('scan_count')
          .eq('id', websiteId)
          .single()
          .then(({ data }) => {
            if (data) {
              supabase
                .from('websites')
                .update({ scan_count: (data.scan_count || 0) + 1 })
                .eq('id', websiteId);
            }
          });
      });
    } catch (err) {
      console.warn('[WebsiteService] updateLastScan failed:', err.message);
    }
  },

  async delete(websiteId, userId) {
    if (!websiteId || !userId) return false;
    try {
      const { error } = await supabase
        .from('websites')
        .delete()
        .eq('id', websiteId)
        .eq('user_id', userId);
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('[WebsiteService] delete failed:', err.message);
      return false;
    }
  },
};

// ================================================================
// SCAN SERVICE — Supabase (lightweight metadata only)
// ================================================================
export const scanService = {
  async create(userId, url, websiteId = null) {
    if (!userId || !url) return null;
    const domain = url.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    try {
      const { data, error } = await supabase
        .from('scans')
        .insert([{
          user_id: userId,
          url,
          domain,
          website_id: websiteId,
          status: 'running',
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('[ScanService] create failed:', err.message);
      // Return a local fallback ID so the scan can still proceed
      return {
        id: crypto.randomUUID(),
        user_id: userId,
        url,
        domain,
        status: 'running',
        _local: true,
      };
    }
  },

  async complete(scanId, results, isLocal = false) {
    const updates = {
      status: 'completed',
      overall_score: results.overallScore,
      security_score: results.scores.security,
      performance_score: results.scores.performance,
      seo_score: results.scores.seo,
      accessibility_score: results.scores.accessibility,
      best_practices_score: results.scores.bestPractices,
      risk_level: results.riskLevel,
      issues_count: results.issuesCount,
      critical_count: results.criticalCount,
      summary: results.summary,
      completed_at: new Date().toISOString(),
    };

    if (isLocal) return updates; // Can't save to Supabase if scan was local

    try {
      const { error } = await supabase
        .from('scans')
        .update(updates)
        .eq('id', scanId);
      if (error) throw error;
    } catch (err) {
      console.warn('[ScanService] complete failed:', err.message);
    }
    return updates;
  },

  async fail(scanId, errorMessage, isLocal = false) {
    if (isLocal) return;
    try {
      await supabase
        .from('scans')
        .update({
          status: 'failed',
          error_message: errorMessage,
          completed_at: new Date().toISOString(),
        })
        .eq('id', scanId);
    } catch (err) {
      console.warn('[ScanService] fail update failed:', err.message);
    }
  },

  async getAll(userId, limit = 30) {
    if (!userId) return [];
    try {
      const { data, error } = await supabase
        .from('scans')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('[ScanService] getAll failed:', err.message);
      return [];
    }
  },

  async getById(scanId) {
    if (!scanId) return null;
    try {
      const { data, error } = await supabase
        .from('scans')
        .select('*')
        .eq('id', scanId)
        .single();
      if (error) throw error;
      return data;
    } catch {
      return null;
    }
  },

  async delete(scanId, userId) {
    if (!scanId || !userId) return false;
    try {
      const { error } = await supabase
        .from('scans')
        .delete()
        .eq('id', scanId)
        .eq('user_id', userId);
      if (error) throw error;
      reportCache.remove(scanId);
      return true;
    } catch (err) {
      console.warn('[ScanService] delete failed:', err.message);
      return false;
    }
  },

  async getStats(userId) {
    if (!userId) return { totalScans: 0, avgScore: 0, criticalIssues: 0 };
    try {
      const { data, error } = await supabase
        .from('scans')
        .select('overall_score, critical_count, status')
        .eq('user_id', userId)
        .eq('status', 'completed');
      if (error) throw error;

      const completed = data || [];
      const totalScans = completed.length;
      const avgScore = totalScans > 0
        ? Math.round(completed.reduce((sum, s) => sum + (s.overall_score || 0), 0) / totalScans)
        : 0;
      const criticalIssues = completed.reduce((sum, s) => sum + (s.critical_count || 0), 0);

      return { totalScans, avgScore, criticalIssues };
    } catch {
      return { totalScans: 0, avgScore: 0, criticalIssues: 0 };
    }
  },
};

// ================================================================
// LEGACY — keep old 'db' export for backward compatibility
// (used by landing page demo scanner, etc.)
// ================================================================
export const db = {
  getCollection: (name) => {
    try {
      const data = localStorage.getItem(name);
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  },
  saveCollection: (name, data) => {
    try { localStorage.setItem(name, JSON.stringify(data)); return true; } catch { return false; }
  },
  getById: (collection, id) => {
    const items = db.getCollection(collection);
    return items.find(item => item.id === id) || null;
  },
  create: (collection, item) => {
    const items = db.getCollection(collection);
    items.push(item);
    db.saveCollection(collection, items);
    return item;
  },
  update: (collection, id, updates) => {
    const items = db.getCollection(collection);
    const index = items.findIndex(item => item.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...updates };
      db.saveCollection(collection, items);
      return items[index];
    }
    return null;
  },
  remove: (collection, id) => {
    const items = db.getCollection(collection);
    const filtered = items.filter(item => item.id !== id);
    if (filtered.length !== items.length) {
      db.saveCollection(collection, filtered);
      return true;
    }
    return false;
  },
  query: (collection, filterFn) => {
    return db.getCollection(collection).filter(filterFn);
  },
  clear: (collection) => { localStorage.removeItem(collection); },
};
