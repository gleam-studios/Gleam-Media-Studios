-- Site-wide skill packs for /chat (managed in settings, shared across all users).

create table if not exists public.site_skill_packs (
  id text primary key,
  title text not null,
  skills jsonb not null,
  imported_at timestamptz not null default now()
);

create index if not exists site_skill_packs_imported_idx
  on public.site_skill_packs (imported_at desc);

alter table public.site_skill_packs enable row level security;

create policy site_skill_packs_read_authenticated on public.site_skill_packs
  for select
  to authenticated
  using (true);

create policy site_skill_packs_write_authenticated on public.site_skill_packs
  for all
  to authenticated
  using (true)
  with check (true);

-- One-time merge from per-user packs (distinct by id, keep newest import).
insert into public.site_skill_packs (id, title, skills, imported_at)
select distinct on (id) id, title, skills, imported_at
from public.chat_skill_packs
order by id, imported_at desc
on conflict (id) do nothing;
