-- Chat workspace: per-user conversations & skill packs (independent of projects).

create table if not exists public.chat_conversations (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default '新对话',
  messages jsonb not null default '[]'::jsonb,
  attachments jsonb not null default '[]'::jsonb,
  enabled_skill_pack_ids text[] null,
  updated_at timestamptz not null default now()
);

create index if not exists chat_conversations_user_updated_idx
  on public.chat_conversations (user_id, updated_at desc);

alter table public.chat_conversations enable row level security;

create policy chat_conversations_own on public.chat_conversations
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.chat_skill_packs (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  skills jsonb not null,
  imported_at timestamptz not null default now()
);

create index if not exists chat_skill_packs_user_imported_idx
  on public.chat_skill_packs (user_id, imported_at desc);

alter table public.chat_skill_packs enable row level security;

create policy chat_skill_packs_own on public.chat_skill_packs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table public.site_settings
  add column if not exists chat jsonb not null default '{}'::jsonb;
