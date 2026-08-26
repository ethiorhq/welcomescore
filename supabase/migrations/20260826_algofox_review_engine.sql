-- Algofox Review Engine: private server-side cache and rate-limit accounting.
-- This migration is additive and intentionally does not alter repo_evaluations,
-- Hall of Fame behavior, or anonymous Dev Lounge tables.

create extension if not exists pgcrypto;
create extension if not exists pg_cron;

create table if not exists public.review_cache (
  id uuid primary key default gen_random_uuid(),
  repo_path text not null,
  context_hash text not null unique,
  review_version integer not null default 1 check (review_version > 0),
  score integer not null check (score between 0 and 100),
  payload jsonb not null,
  provider_used text not null check (provider_used in ('groq', 'gemini', 'rule-engine')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists review_cache_repo_expiry_idx
  on public.review_cache (repo_path, expires_at desc);

create table if not exists public.review_rate_limits (
  bucket text primary key,
  request_count integer not null default 0 check (request_count >= 0),
  window_started_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.review_cache enable row level security;
alter table public.review_rate_limits enable row level security;

revoke all on table public.review_cache from anon, authenticated;
revoke all on table public.review_rate_limits from anon, authenticated;
grant select, insert, update on table public.review_cache to service_role;

create or replace function public.consume_review_rate_limit(
  p_bucket text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_now timestamptz := now();
  v_count integer;
  v_window_started_at timestamptz;
begin
  if p_bucket is null or length(p_bucket) < 16 or p_limit < 1 or p_window_seconds < 1 then
    return false;
  end if;

  insert into public.review_rate_limits (bucket, request_count, window_started_at, updated_at)
  values (p_bucket, 1, v_now, v_now)
  on conflict (bucket) do update
    set request_count = case
          when public.review_rate_limits.window_started_at <= v_now - make_interval(secs => p_window_seconds)
            then 1
          else public.review_rate_limits.request_count + 1
        end,
        window_started_at = case
          when public.review_rate_limits.window_started_at <= v_now - make_interval(secs => p_window_seconds)
            then v_now
          else public.review_rate_limits.window_started_at
        end,
        updated_at = v_now
  returning request_count, window_started_at into v_count, v_window_started_at;

  return v_count <= p_limit and v_window_started_at > v_now - make_interval(secs => p_window_seconds);
end;
$$;

revoke all on function public.consume_review_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_review_rate_limit(text, integer, integer) to service_role;

do $$
begin
  if not exists (select 1 from cron.job where jobname = 'purge-expired-algofox-review-cache') then
    perform cron.schedule(
      'purge-expired-algofox-review-cache',
      '17 * * * *',
      $cron$delete from public.review_cache where expires_at <= now();
        delete from public.review_rate_limits where updated_at <= now() - interval '2 days';$cron$
    );
  end if;
end;
$$;
