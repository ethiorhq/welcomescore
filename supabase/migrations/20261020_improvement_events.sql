-- WelcomeScore Improvement Events Schema
-- Privacy-safe public repository improvement history tracking.
-- Only records public repository audit changes; no private community data.

CREATE TABLE IF NOT EXISTS public.repo_improvement_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_path TEXT NOT NULL,
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  previous_score INT,
  new_score INT NOT NULL,
  previous_grade TEXT,
  new_grade TEXT NOT NULL,
  score_delta INT,
  default_branch TEXT,
  commit_sha TEXT,
  changed_signals JSONB NOT NULL DEFAULT '[]'::jsonb,
  completed_moves JSONB NOT NULL DEFAULT '[]'::jsonb,
  remaining_move_id TEXT,
  confidence TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for timeline queries ordered by analysis time
CREATE INDEX IF NOT EXISTS idx_repo_improvement_events_repo_time
  ON public.repo_improvement_events(repo_path, analyzed_at DESC);

-- Enable Row Level Security
ALTER TABLE public.repo_improvement_events ENABLE ROW LEVEL SECURITY;

-- Allow public read access (timeline is public maintainer progress)
CREATE POLICY "Public read improvement events"
  ON public.repo_improvement_events
  FOR SELECT
  TO public
  USING (true);

-- Restrict insertions to service_role only (server-side audit engine)
CREATE POLICY "Service role insert improvement events"
  ON public.repo_improvement_events
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- No public updates or deletes allowed
