-- Consumo atômico de convite: valida + incrementa used_count sob lock (FOR UPDATE),
-- eliminando a race de resgate (TOCTOU) na API /api/auth/signup.
-- A função já existia em setup-completo.sql mas não em migration numerada — aqui é a fonte de verdade.

create or replace function public.consume_invite_token(p_token text)
returns table (
  id uuid,
  max_uses int,
  used_count int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.invite_tokens%rowtype;
begin
  select * into v_row
  from public.invite_tokens t
  where lower(trim(t.token)) = lower(trim(p_token))
  for update;

  if not found then
    return;
  end if;

  if not v_row.active then
    raise exception 'invite_inactive';
  end if;

  if v_row.expires_at is not null and v_row.expires_at < now() then
    raise exception 'invite_expired';
  end if;

  if v_row.used_count >= v_row.max_uses then
    raise exception 'invite_exhausted';
  end if;

  update public.invite_tokens
  set used_count = used_count + 1
  where invite_tokens.id = v_row.id
  returning invite_tokens.id, invite_tokens.max_uses, invite_tokens.used_count
  into id, max_uses, used_count;

  return next;
end;
$$;

revoke all on function public.consume_invite_token(text) from public;
revoke execute on function public.consume_invite_token(text) from anon, authenticated;
-- Só a service role executa, via backend Next (/api/auth/signup com admin client).
-- O revoke de public NÃO basta: o Supabase concede execute a anon/authenticated por
-- default privileges na criação da função; por isso o revoke explícito desses roles.

comment on function public.consume_invite_token(text) is
  'Incrementa used_count de forma atômica. Chamada pela API /api/auth/signup com service role.';
