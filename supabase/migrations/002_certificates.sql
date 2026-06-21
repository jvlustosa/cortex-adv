-- Certificados emitidos pela Claude Academy (verificação pública via RPC)
create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  recipient_name text not null,
  course_title text not null default 'Claude Academy: IA generativa para advogados',
  workload_hours int not null default 12 check (workload_hours > 0),
  issued_at date not null default current_date,
  revoked_at timestamptz,
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists certificates_code_lower_idx
  on public.certificates (lower(trim(code)));

comment on table public.certificates is
  'Certificados digitais Claude Academy. Verificação pública somente via verify_certificate().';

alter table public.certificates enable row level security;

create or replace function public.verify_certificate(p_code text)
returns table (
  code text,
  recipient_name text,
  course_title text,
  workload_hours int,
  issued_at date
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    c.code,
    c.recipient_name,
    c.course_title,
    c.workload_hours,
    c.issued_at
  from public.certificates c
  where lower(trim(c.code)) = lower(trim(p_code))
    and c.revoked_at is null;
end;
$$;

revoke all on function public.verify_certificate(text) from public;
grant execute on function public.verify_certificate(text) to anon, authenticated;

-- Certificado de demonstração (prévia do site)
insert into public.certificates (code, recipient_name, issued_at)
values ('CA-2026-48271', 'Dra. Maria Silva', '2026-06-01')
on conflict (code) do nothing;
