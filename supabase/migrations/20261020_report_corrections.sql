-- Report Corrections & Trust Loop: Store maintainer-submitted signal corrections
-- Submissions remain private and are never publicly queryable without service role.

create extension if not exists pgcrypto;

create table if not exists public.report_corrections (
  id uuid primary key default gen_random_uuid(),
  repo_path text not null,
  evidence_id text not null,
  reason_category text not null check (
    reason_category in ('external_location', 'custom_license', 'external_ci', 'monorepo_structure', 'stale_status', 'other')
  ),
  explanation text not null check (length(explanation) between 10 and 500),
  source_url text,
  status text not null default 'needs-review' check (
    status in ('needs-review', 'resolved', 'rejected', 'duplicate')
  ),
  triage_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists report_corrections_repo_status_idx
  on public.report_corrections (repo_path, status);

create index if not exists report_corrections_created_at_idx
  on public.report_corrections (created_at desc);

-- RLS: submissions are private to maintainers and must not be exposed to anon clients
alter table public.report_corrections enable row level security;

revoke all on table public.report_corrections from anon, authenticated;
grant select, insert, update on table public.report_corrections to service_role;
