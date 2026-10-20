-- WelcomeScore & ETHIOR Subscriber & Waitlist Collection
-- Table for storing subscriber emails with Row Level Security (RLS)

CREATE TABLE IF NOT EXISTS public.subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  source TEXT DEFAULT 'welcomescore_app',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Allow public anonymous inserts from frontend / API
DROP POLICY IF EXISTS "Allow public anon inserts" ON public.subscribers;
CREATE POLICY "Allow public anon inserts" ON public.subscribers
FOR INSERT WITH CHECK (true);

-- Allow service role full management
DROP POLICY IF EXISTS "Allow service role full management" ON public.subscribers;
CREATE POLICY "Allow service role full management" ON public.subscribers
FOR ALL USING (auth.role() = 'service_role');

-- Fast index on email for duplicate lookups and deduplication
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON public.subscribers (email);
CREATE INDEX IF NOT EXISTS idx_subscribers_created_at ON public.subscribers (created_at DESC);
