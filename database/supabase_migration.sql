-- ============================================================
-- SecureScan AI / SiteProof — Supabase Database Migration
-- ============================================================
-- HOW TO USE:
-- 1. Go to https://supabase.com/dashboard
-- 2. Open your project
-- 3. Click "SQL Editor" in the left sidebar
-- 4. Paste this ENTIRE file
-- 5. Click "Run"
--
-- STORAGE NOTE:
-- Only lightweight metadata is stored here (~300 bytes/scan).
-- Full report details (issues, raw data) stay in the user's
-- browser. PDFs are generated client-side. This keeps Supabase
-- storage usage minimal on the free tier.
-- ============================================================

-- ==================
-- TABLE: profiles
-- ==================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  scans_this_month INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================
-- TABLE: websites
-- ==================
CREATE TABLE IF NOT EXISTS public.websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  domain TEXT NOT NULL,
  name TEXT DEFAULT '',
  last_score INTEGER,
  last_scanned_at TIMESTAMPTZ,
  scan_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================
-- TABLE: scans
-- ==================
-- Lightweight: only scores and metadata, NO full report data
CREATE TABLE IF NOT EXISTS public.scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  website_id UUID REFERENCES public.websites(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  domain TEXT NOT NULL DEFAULT '',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  overall_score INTEGER,
  security_score INTEGER,
  performance_score INTEGER,
  seo_score INTEGER,
  accessibility_score INTEGER,
  best_practices_score INTEGER,
  risk_level TEXT DEFAULT 'Unknown',
  issues_count INTEGER DEFAULT 0,
  critical_count INTEGER DEFAULT 0,
  summary TEXT DEFAULT '',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ==================
-- INDEXES
-- ==================
CREATE INDEX IF NOT EXISTS idx_websites_user_id ON public.websites(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_user_id ON public.scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_website_id ON public.scans(website_id);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON public.scans(created_at DESC);

-- ==================
-- ROW LEVEL SECURITY
-- ==================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- WEBSITES
CREATE POLICY "Users can view own websites"
  ON public.websites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own websites"
  ON public.websites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own websites"
  ON public.websites FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own websites"
  ON public.websites FOR DELETE USING (auth.uid() = user_id);

-- SCANS
CREATE POLICY "Users can view own scans"
  ON public.scans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scans"
  ON public.scans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own scans"
  ON public.scans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own scans"
  ON public.scans FOR DELETE USING (auth.uid() = user_id);

-- ==================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ==================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==================
-- AUTO-UPDATE updated_at
-- ==================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS set_websites_updated_at ON public.websites;
CREATE TRIGGER set_websites_updated_at
  BEFORE UPDATE ON public.websites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- DONE! Your database is ready.
-- Storage per scan: ~300 bytes (scores + metadata only)
-- 10,000 scans ≈ 3MB — well within free tier
-- ============================================================
