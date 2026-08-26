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
