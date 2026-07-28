-- Itens da Galeria Premium (skills e conectores) — gestão via admin.
-- Arquivos de skill no bucket privado 'pack-items'; metadados nesta tabela.

create type public.pack_item_kind as enum ('skill-file', 'remote-connector', 'lesson-ref');
create type public.pack_item_status as enum ('ready', 'teaser');
create type public.pack_item_tier as enum ('premium', 'amostra');

create table if not exists public.pack_items (
  id uuid primary key default gen_random_uuid(),
  pack_id text not null check (pack_id in ('skills', 'conectores')),
  kind public.pack_item_kind not null,
  name text not null,
  description text not null,
  status public.pack_item_status not null default 'ready',
  tier public.pack_item_tier not null default 'premium',
  -- skill-file
  file_path text,
  file_name text,
  content_type text,
  size_bytes bigint,
  -- remote-connector
  connector_url text,
  setup_steps jsonb not null default '[]'::jsonb,
  -- lesson-ref
  module_id text,
  lesson_id text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pack_items_pack_sort_idx
  on public.pack_items (pack_id, sort_order);

alter table public.pack_items enable row level security;
-- Sem policy pública: só service role (API routes) lê/grava.

insert into storage.buckets (id, name, public)
values ('pack-items', 'pack-items', false)
on conflict (id) do nothing;
