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
