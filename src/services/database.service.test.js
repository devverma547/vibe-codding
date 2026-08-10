import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reportCache, websiteService, scanService, contactService, db } from './database.service';
import { supabase } from '../config/supabase';
import { emailService } from './email.service';

// Mock dependencies
vi.mock('../config/supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        download: vi.fn(),
        remove: vi.fn(),
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
      single: vi.fn(),
    })),
    rpc: vi.fn(),
  }
}));

vi.mock('./email.service', () => ({
  emailService: {
    sendContactNotification: vi.fn()
  }
}));

// Helper to create chained mocks for Supabase from()
const createSupabaseChain = (mockReturnData = null, mockReturnError = null) => {
  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: mockReturnData, error: mockReturnError }),
  };
  // Also support array resolve for select()
  chain.then = (resolve) => resolve({ data: mockReturnData, error: mockReturnError });
  return chain;
};

describe('Database Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('reportCache', () => {
    it('saves report to supabase storage', async () => {
      const mockUpload = vi.fn().mockResolvedValue({ error: null });
      supabase.storage.from.mockReturnValue({ upload: mockUpload });

      await reportCache.save('scan123', { score: 95 });

      expect(supabase.storage.from).toHaveBeenCalledWith('reports');
      expect(mockUpload).toHaveBeenCalledWith('scan123.json', JSON.stringify({ score: 95 }), expect.any(Object));
    });

    it('falls back to localStorage if supabase storage fails', async () => {
      const mockUpload = vi.fn().mockResolvedValue({ error: { message: 'Storage error' } });
      supabase.storage.from.mockReturnValue({ upload: mockUpload });

      await reportCache.save('scan123', { score: 95 });
      
      const localData = JSON.parse(localStorage.getItem('siteproof-report-scan123'));
      expect(localData).toEqual({ score: 95 });
    });
  });

  describe('websiteService', () => {
    it('getAll returns websites for a user', async () => {
      const mockWebsites = [{ id: '1', url: 'https://test.com' }];
      const chain = createSupabaseChain(mockWebsites);
      supabase.from.mockReturnValue(chain);

      const result = await websiteService.getAll('user123');
      expect(result).toEqual(mockWebsites);
      expect(supabase.from).toHaveBeenCalledWith('websites');
      expect(chain.eq).toHaveBeenCalledWith('user_id', 'user123');
    });

    it('create inserts a new website', async () => {
      const mockWebsite = { id: '1', domain: 'test.com' };
      const chain = createSupabaseChain(mockWebsite);
      supabase.from.mockReturnValue(chain);

      const result = await websiteService.create('user123', 'https://test.com', 'repo/test');
      
      expect(supabase.from).toHaveBeenCalledWith('websites');
      expect(chain.insert).toHaveBeenCalledWith([{
        user_id: 'user123',
        url: 'https://test.com',
        domain: 'test.com',
        name: 'test.com',
        github_repo: 'repo/test'
      }]);
      expect(result).toEqual(mockWebsite);
    });
  });

  describe('scanService', () => {
    it('create inserts a new scan', async () => {
      const mockScan = { id: 'scan1', url: 'https://test.com' };
      const chain = createSupabaseChain(mockScan);
      supabase.from.mockReturnValue(chain);

      const result = await scanService.create('user123', 'https://test.com', 'web123');
      
      expect(supabase.from).toHaveBeenCalledWith('scans');
      expect(chain.insert).toHaveBeenCalledWith([{
        user_id: 'user123',
        url: 'https://test.com',
        domain: 'test.com',
        website_id: 'web123',
        status: 'running'
      }]);
      expect(result).toEqual(mockScan);
    });
  });

  describe('contactService', () => {
    it('saves contact message and sends email', async () => {
      const mockData = { id: 'msg1' };
      const chain = createSupabaseChain(mockData);
      supabase.from.mockReturnValue(chain);
      emailService.sendContactNotification.mockResolvedValue({ success: true });

      const formData = { name: 'John', email: 'john@test.com', subject: 'Test', message: 'Hello' };
      const result = await contactService.save(formData);

      expect(emailService.sendContactNotification).toHaveBeenCalledWith(expect.objectContaining({
        name: 'John',
        email: 'john@test.com'
      }));
      expect(supabase.from).toHaveBeenCalledWith('contact_messages');
      expect(result.success).toBe(true);
      expect(result.source).toBe('supabase');
    });
  });

  describe('legacy db (localStorage)', () => {
    it('creates and retrieves items', () => {
      const item = { id: '1', name: 'Test' };
      db.create('test_collection', item);
      
      const results = db.getCollection('test_collection');
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual(item);
      
      const found = db.getById('test_collection', '1');
      expect(found).toEqual(item);
    });
  });
});
