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
