-- WelcomeScore Full Supabase Setup Script
-- Run this in your Supabase SQL Editor

-- ==========================================
-- Migration: 20260826_algofox_review_engine.sql
-- ==========================================

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


-- ==========================================
-- Migration: 20260826_dev_lounge.sql
-- ==========================================

-- WelcomeScore Anonymous Dev Lounge
-- Run this once in the Supabase SQL Editor for the WelcomeScore project.
-- It is safe to re-run: policies, the realtime publication, and cron job are created idempotently.

create extension if not exists pgcrypto;
create extension if not exists pg_cron;

create table if not exists public.lounge_messages (
  id uuid primary key default gen_random_uuid(),
  session_hash text not null check (char_length(session_hash) between 16 and 128),
  dev_handle text not null check (char_length(dev_handle) between 3 and 64),
  avatar_seed text not null check (char_length(avatar_seed) between 16 and 128),
  content text not null default '' check (char_length(content) <= 300),
  score_card jsonb default null,
  pet_reaction jsonb default null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  constraint lounge_message_has_content_or_score
    check (char_length(content) > 0 or score_card is not null)
);

create index if not exists idx_lounge_messages_active
  on public.lounge_messages (expires_at desc, created_at asc);

alter table public.lounge_messages enable row level security;

-- Explicit grants keep anonymous browser access limited to reading active messages and adding messages.
revoke all on table public.lounge_messages from anon, authenticated;
grant select, insert on table public.lounge_messages to anon, authenticated;

drop policy if exists "Public can read active lounge messages" on public.lounge_messages;
create policy "Public can read active lounge messages"
on public.lounge_messages
for select
to anon, authenticated
using (expires_at > now());

drop policy if exists "Public can insert valid lounge messages" on public.lounge_messages;
create policy "Public can insert valid lounge messages"
on public.lounge_messages
for insert
to anon, authenticated
with check (
  expires_at > now()
  and expires_at <= now() + interval '25 hours'
  and char_length(session_hash) between 16 and 128
  and char_length(dev_handle) between 3 and 64
  and char_length(avatar_seed) between 16 and 128
  and char_length(content) <= 300
  and (char_length(content) > 0 or score_card is not null)
);

-- Do not give browser clients update or delete capability. Cleanup runs inside Postgres.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'lounge_messages'
  ) then
    alter publication supabase_realtime add table public.lounge_messages;
  end if;
end;
$$;

-- Purge expired messages hourly. The guard avoids creating duplicate cron jobs on rerun.
do $$
begin
  if not exists (
    select 1 from cron.job where jobname = 'purge-dev-lounge-messages'
  ) then
    perform cron.schedule(
      'purge-dev-lounge-messages',
      '0 * * * *',
      $cron$delete from public.lounge_messages where expires_at <= now();$cron$
    );
  end if;
end;
$$;

-- Optional verification: inspect the table, policies, realtime publication, and cleanup job.
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public' and tablename = 'lounge_messages'
order by policyname;

select jobid, jobname, schedule, command
from cron.job
where jobname = 'purge-dev-lounge-messages';


-- ==========================================
-- Migration: 20260826_dev_lounge_reactions.sql
-- ==========================================

-- Run this after the Dev Lounge and reply migrations in the Supabase SQL Editor.
-- Each anonymous browser may add one of the four permitted reactions to a message.
-- Reactions are deleted automatically when their parent message expires.

create table if not exists public.lounge_reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.lounge_messages(id) on delete cascade,
  session_hash text not null check (char_length(session_hash) between 16 and 128),
  reaction text not null check (reaction in ('thumbs_up', 'lightbulb', 'tada', 'eyes')),
  created_at timestamptz not null default now(),
  constraint lounge_reactions_one_per_session_per_message unique (message_id, session_hash)
);

create index if not exists idx_lounge_reactions_message_id
  on public.lounge_reactions (message_id, created_at asc);

alter table public.lounge_reactions enable row level security;

-- Browser clients may read reactions for live messages and add one reaction,
-- but they cannot alter or remove any reaction.
revoke all on table public.lounge_reactions from anon, authenticated;
grant select, insert on table public.lounge_reactions to anon, authenticated;

drop policy if exists "Public can read active lounge reactions" on public.lounge_reactions;
create policy "Public can read active lounge reactions"
on public.lounge_reactions
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.lounge_messages
    where lounge_messages.id = lounge_reactions.message_id
      and lounge_messages.expires_at > now()
  )
);

drop policy if exists "Public can add one valid lounge reaction" on public.lounge_reactions;
create policy "Public can add one valid lounge reaction"
on public.lounge_reactions
for insert
to anon, authenticated
with check (
  char_length(session_hash) between 16 and 128
  and reaction in ('thumbs_up', 'lightbulb', 'tada', 'eyes')
  and exists (
    select 1
    from public.lounge_messages
    where lounge_messages.id = lounge_reactions.message_id
      and lounge_messages.expires_at > now()
  )
);

-- Add reactions to Supabase Realtime once, without touching the existing chat table.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'lounge_reactions'
  ) then
    alter publication supabase_realtime add table public.lounge_reactions;
  end if;
end;
$$;

-- Optional verification.
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public' and tablename = 'lounge_reactions'
order by policyname;


-- ==========================================
-- Migration: 20260826_dev_lounge_replies.sql
-- ==========================================

-- Run this after 20260826_dev_lounge.sql in the Supabase SQL Editor.
-- Reply context is stored as a bounded snapshot rather than a foreign key so a
-- reply can keep its context even after the original 24-hour message expires.

alter table public.lounge_messages
  add column if not exists reply_to jsonb default null;

alter table public.lounge_messages
  drop constraint if exists lounge_message_reply_to_shape;

alter table public.lounge_messages
  add constraint lounge_message_reply_to_shape
  check (
    reply_to is null
    or (
      jsonb_typeof(reply_to) = 'object'
      and reply_to ? 'id'
      and reply_to ? 'dev_handle'
      and reply_to ? 'content'
      and reply_to ? 'created_at'
      and (reply_to ->> 'id') ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      and char_length(reply_to ->> 'dev_handle') between 3 and 64
      and char_length(reply_to ->> 'content') between 1 and 300
      and char_length(reply_to ->> 'created_at') between 1 and 64
    )
  );

-- Keep anonymous browser access insert-only. The reply payload is deliberately
-- limited to display-safe snapshot fields; it does not add an update/delete path.
drop policy if exists "Public can insert valid lounge messages" on public.lounge_messages;
create policy "Public can insert valid lounge messages"
on public.lounge_messages
for insert
to anon, authenticated
with check (
  expires_at > now()
  and expires_at <= now() + interval '25 hours'
  and char_length(session_hash) between 16 and 128
  and char_length(dev_handle) between 3 and 64
  and char_length(avatar_seed) between 16 and 128
  and char_length(content) <= 300
  and (char_length(content) > 0 or score_card is not null)
  and (
    reply_to is null
    or (
      jsonb_typeof(reply_to) = 'object'
      and reply_to ? 'id'
      and reply_to ? 'dev_handle'
      and reply_to ? 'content'
      and reply_to ? 'created_at'
      and (reply_to ->> 'id') ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      and char_length(reply_to ->> 'dev_handle') between 3 and 64
      and char_length(reply_to ->> 'content') between 1 and 300
      and char_length(reply_to ->> 'created_at') between 1 and 64
    )
  )
);

-- Optional verification.
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'lounge_messages'
  and column_name = 'reply_to';


-- ==========================================
-- Migration: 20260827_dev_lounge_high_signal.sql
-- ==========================================

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


-- ==========================================
-- Migration: 20260828_dev_lounge_moderation_and_verification.sql
-- ==========================================

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


-- ==========================================
-- Migration: 20261020_improvement_events.sql
-- ==========================================

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


-- ==========================================
-- Migration: 20261020_report_corrections.sql
-- ==========================================

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


-- ==========================================
-- Migration: 20261020_subscribers.sql
-- ==========================================

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


