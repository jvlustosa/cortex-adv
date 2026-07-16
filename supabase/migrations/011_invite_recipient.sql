-- Convite vinculado a uma pessoa: nome, e-mail e título honorífico.
-- Usados na saudação personalizada e no pré-preenchimento do /signup.
-- O link continua carregando só o token; os dados são lidos do banco.

alter table public.invite_tokens
  add column if not exists recipient_name text,
  add column if not exists recipient_email text,
  add column if not exists recipient_title text;

-- Título aceita apenas 'dr' | 'dra' | null (renderizado como Dr./Dra. na UI).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'invite_tokens_recipient_title_chk'
  ) then
    alter table public.invite_tokens
      add constraint invite_tokens_recipient_title_chk
      check (recipient_title in ('dr', 'dra'));
  end if;
end $$;

comment on column public.invite_tokens.recipient_name is
  'Nome do convidado, exibido na saudação do cadastro.';
comment on column public.invite_tokens.recipient_email is
  'E-mail do convidado, pré-preenchido (editável) no cadastro.';
comment on column public.invite_tokens.recipient_title is
  'Título honorífico do convidado: dr | dra | null.';
