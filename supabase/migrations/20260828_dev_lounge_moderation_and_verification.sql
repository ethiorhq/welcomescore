-- Dev Lounge reply navigation, moderation audit, and verification support.
-- Apply only after the matching application commit is deployed with
-- LOUNGE_CONTEXT_SIGNING_SECRET and LOUNGE_ABUSE_SALT configured.
-- This migration is additive and idempotent. It does not seed, alter, hide,
-- delete, rank, or otherwise change an existing Lounge message.

create extension if not exists pg_cron;

-- 1. Private moderation events reference existing private reports and do not
-- duplicate public message content. Browser roles have no access.
create table if not exists public.lounge_moderation_events (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null unique references public.lounge_reports(id) on delete cascade,
  message_id uuid not null references public.lounge_messages(id) on delete cascade,
  decision text not null check (decision in ('allow', 'needs_review', 'hide')),
  category text not null check (category in ('safe', 'spam', 'secrets', 'harassment', 'unsafe_link', 'scam', 'other')),
  confidence text not null check (confidence in ('low', 'medium', 'high')),
  rationale text not null check (char_length(rationale) between 8 and 280),
  provider text not null check (provider in ('groq', 'gemini', 'deterministic')),
  model text null check (model is null or char_length(model) between 1 and 160),
  action_taken text not null check (action_taken in ('none', 'hidden')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);

create index if not exists lounge_moderation_events_message_idx
  on public.lounge_moderation_events (message_id, created_at desc);
create index if not exists lounge_moderation_events_expiry_idx
  on public.lounge_moderation_events (expires_at asc);

alter table public.lounge_moderation_events enable row level security;
revoke all on table public.lounge_moderation_events from anon, authenticated;

-- 2. Add explicit salted-network rate-budget action names. The server stores
-- only an HMAC bucket, never the raw network identifier or forwarded IP.
alter table public.lounge_rate_events
  drop constraint if exists lounge_rate_events_action_check;
alter table public.lounge_rate_events
  add constraint lounge_rate_events_action_check
  check (action in (
    'root-post', 'reply', 'reaction', 'context', 'report',
    'network-root-post', 'network-reply', 'network-reaction', 'network-context', 'network-report'
  ));

create or replace function public.consume_lounge_rate_event(
  p_session_hash text,
  p_action text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  recent_count integer;
begin
  if char_length(p_session_hash) < 16
    or p_action not in (
      'root-post', 'reply', 'reaction', 'context', 'report',
      'network-root-post', 'network-reply', 'network-reaction', 'network-context', 'network-report'
    )
    or p_limit < 1
    or p_limit > 100
    or p_window_seconds < 1
    or p_window_seconds > 86400 then
    return false;
  end if;

  perform pg_advisory_xact_lock(hashtext(p_session_hash || ':' || p_action));

  select count(*) into recent_count
  from public.lounge_rate_events
  where session_hash = p_session_hash
    and action = p_action
    and created_at >= now() - make_interval(secs => p_window_seconds);

  if recent_count >= p_limit then
    return false;
  end if;

  insert into public.lounge_rate_events (session_hash, action, expires_at)
  values (p_session_hash, p_action, now() + make_interval(secs => p_window_seconds + 60));

  return true;
end;
$$;

revoke all on function public.consume_lounge_rate_event(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_lounge_rate_event(text, text, integer, integer) to service_role;

-- 3. Private operational metadata has the same short retention posture as
-- reports and rate events. No public realtime publication is added.
do $$
begin
  if not exists (
    select 1 from cron.job where jobname = 'purge-dev-lounge-moderation-events'
  ) then
    perform cron.schedule(
      'purge-dev-lounge-moderation-events',
      '29 * * * *',
      'delete from public.lounge_moderation_events where expires_at <= now()'
    );
  end if;
end;
$$;

-- Optional post-apply verification. These are read-only checks.
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('lounge_messages', 'lounge_reports', 'lounge_rate_events', 'lounge_moderation_events')
order by tablename, policyname;

select jobid, jobname, schedule
from cron.job
where jobname in ('purge-dev-lounge-rate-events', 'purge-dev-lounge-reports', 'purge-dev-lounge-moderation-events')
order by jobname;
