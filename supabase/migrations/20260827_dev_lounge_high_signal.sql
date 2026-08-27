-- WelcomeScore Priority 2: verified high-signal Dev Lounge.
--
-- Apply this once in the Supabase SQL Editor after the matching server routes
-- are deployed with SUPABASE_SERVICE_ROLE_KEY and LOUNGE_CONTEXT_SIGNING_SECRET.
-- This migration is additive and idempotent. It does not create, edit, hide,
-- delete, seed, or rank any existing Lounge message, reaction, report, or Hall row.

create extension if not exists pgcrypto;
create extension if not exists pg_cron;

-- 1. Extend temporary messages with focused, display-safe conversation data.
alter table public.lounge_messages
  add column if not exists topic text not null default 'general',
  add column if not exists parent_message_id uuid null references public.lounge_messages(id) on delete set null,
  add column if not exists community_context jsonb null,
  add column if not exists client_request_id uuid null,
  add column if not exists visibility_state text not null default 'visible';

alter table public.lounge_messages
  drop constraint if exists lounge_message_topic_shape,
  drop constraint if exists lounge_message_visibility_state_shape,
  drop constraint if exists lounge_message_community_context_shape;

alter table public.lounge_messages
  add constraint lounge_message_topic_shape
    check (topic in ('general', 'contributor_question', 'small_win', 'audit_discussion', 'hall_pattern')),
  add constraint lounge_message_visibility_state_shape
    check (visibility_state in ('visible', 'hidden_by_moderator')),
  add constraint lounge_message_community_context_shape
    check (
      community_context is null
      or (
        jsonb_typeof(community_context) = 'object'
        and community_context ? 'kind'
        and community_context ? 'repo'
        and community_context ? 'score'
        and community_context ? 'grade'
        and community_context ? 'auditPath'
        and community_context ->> 'kind' in ('audit', 'hall')
        and char_length(community_context ->> 'repo') between 3 and 200
        and char_length(community_context ->> 'grade') between 1 and 4
        and (community_context ->> 'score') ~ '^(100|[0-9]{1,2})$'
        and char_length(community_context ->> 'auditPath') between 3 and 300
      )
    );

create unique index if not exists lounge_messages_session_request_key
  on public.lounge_messages (session_hash, client_request_id)
  where client_request_id is not null;

create index if not exists lounge_messages_parent_active_idx
  on public.lounge_messages (parent_message_id, created_at asc)
  where parent_message_id is not null;

create index if not exists lounge_messages_topic_active_idx
  on public.lounge_messages (topic, created_at asc)
  where visibility_state = 'visible';

-- Public readers only see still-active, moderator-visible rows. Browser writes
-- are removed below; the server gateway uses the service role after validating input.
drop policy if exists "Public can read active lounge messages" on public.lounge_messages;
create policy "Public can read active visible lounge messages"
  on public.lounge_messages
  for select
  to anon, authenticated
  using (expires_at > now() and visibility_state = 'visible');

-- 2. Keep one useful-response mark local to a question rather than creating
-- contributor reputation or reaction leaderboards.
create table if not exists public.lounge_answer_marks (
  question_message_id uuid primary key references public.lounge_messages(id) on delete cascade,
  answer_message_id uuid not null unique references public.lounge_messages(id) on delete cascade,
  resolver_session_hash text not null check (char_length(resolver_session_hash) between 16 and 128),
  created_at timestamptz not null default now()
);

create index if not exists lounge_answer_marks_answer_idx
  on public.lounge_answer_marks (answer_message_id);

alter table public.lounge_answer_marks enable row level security;
revoke all on table public.lounge_answer_marks from anon, authenticated;
grant select on table public.lounge_answer_marks to anon, authenticated;

drop policy if exists "Public can read active lounge answer marks" on public.lounge_answer_marks;
create policy "Public can read active lounge answer marks"
  on public.lounge_answer_marks
  for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.lounge_messages question
      where question.id = lounge_answer_marks.question_message_id
        and question.expires_at > now()
        and question.visibility_state = 'visible'
    )
    and exists (
      select 1 from public.lounge_messages answer
      where answer.id = lounge_answer_marks.answer_message_id
        and answer.expires_at > now()
        and answer.visibility_state = 'visible'
    )
  );

-- 3. Private reports store identifiers and a reason, not copied public content.
create table if not exists public.lounge_reports (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null,
  reporter_session_hash text not null check (char_length(reporter_session_hash) between 16 and 128),
  reason text not null check (reason in ('spam', 'secrets', 'harassment', 'unsafe-link', 'other')),
  detail text not null default '' check (char_length(detail) <= 240),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days'),
  constraint lounge_reports_one_reason_per_session_message unique (message_id, reporter_session_hash, reason)
);

create index if not exists lounge_reports_expiry_idx
  on public.lounge_reports (expires_at asc);

alter table public.lounge_reports enable row level security;
revoke all on table public.lounge_reports from anon, authenticated;

-- 4. Short-lived server-side rate-event rows protect the anonymous gateway
-- without keeping message text or a public IP address.
create table if not exists public.lounge_rate_events (
  id uuid primary key default gen_random_uuid(),
  session_hash text not null check (char_length(session_hash) between 16 and 128),
  action text not null check (action in ('root-post', 'reply', 'reaction', 'context', 'report')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists lounge_rate_events_lookup_idx
  on public.lounge_rate_events (session_hash, action, created_at desc);
create index if not exists lounge_rate_events_expiry_idx
  on public.lounge_rate_events (expires_at asc);

alter table public.lounge_rate_events enable row level security;
revoke all on table public.lounge_rate_events from anon, authenticated;

-- Atomically consume a small per-session action budget. This function is not
-- exposed to browser roles; it is called only with the server-side service role.
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
    or char_length(p_session_hash) > 128
    or p_action not in ('root-post', 'reply', 'reaction', 'context', 'report')
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

-- 5. Browser clients retain read-only realtime access. The verified server
-- gateway becomes the sole writer for messages, reactions, marks, and reports.
revoke insert, update, delete on table public.lounge_messages from anon, authenticated;
revoke insert, update, delete on table public.lounge_reactions from anon, authenticated;

-- The old direct-insert policies are deliberately removed only after the
-- matching server routes are deployed and environment variables are configured.
drop policy if exists "Public can insert valid lounge messages" on public.lounge_messages;
drop policy if exists "Public can add one valid lounge reaction" on public.lounge_reactions;

-- Add useful-answer marks to Realtime. Existing message/reaction publications
-- stay unchanged and no live rows are created by this migration.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'lounge_answer_marks'
  ) then
    alter publication supabase_realtime add table public.lounge_answer_marks;
  end if;
end;
$$;

-- 6. Reuse the existing hourly cleanup cadence. The new rows contain no raw
-- chat content, but are removed once they are no longer operationally useful.
do $$
begin
  if not exists (
    select 1 from cron.job where jobname = 'purge-dev-lounge-rate-events'
  ) then
    perform cron.schedule(
      'purge-dev-lounge-rate-events',
      '17 * * * *',
      'delete from public.lounge_rate_events where expires_at <= now()'
    );
  end if;

  if not exists (
    select 1 from cron.job where jobname = 'purge-dev-lounge-reports'
  ) then
    perform cron.schedule(
      'purge-dev-lounge-reports',
      '23 * * * *',
      'delete from public.lounge_reports where expires_at <= now()'
    );
  end if;
end;
$$;

-- Optional post-apply verification. This is read-only.
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('lounge_messages', 'lounge_reactions', 'lounge_answer_marks', 'lounge_reports', 'lounge_rate_events')
order by tablename, policyname;

select tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
  and schemaname = 'public'
  and tablename in ('lounge_messages', 'lounge_reactions', 'lounge_answer_marks')
order by tablename;

select jobid, jobname, schedule
from cron.job
where jobname in ('purge-dev-lounge-messages', 'purge-dev-lounge-rate-events', 'purge-dev-lounge-reports')
order by jobname;
