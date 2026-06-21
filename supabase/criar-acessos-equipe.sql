-- =============================================================================
-- Claude Academy · Criar acessos da equipe (auth + painel /admin)
-- Rodar no Supabase → SQL Editor (Run). Idempotente: reexecutar não duplica.
--
-- O login do app é por MAGIC LINK (sem senha): basta a conta existir em
-- auth.users com e-mail confirmado que o link de acesso passa a chegar.
-- (login-form.tsx usa signInWithOtp com shouldCreateUser:false.)
--
-- Os 3 e-mails são de domínios da equipe (@chatjuridico.com.br /
-- @escritoriovilasboas.com), então entram como ADMIN do painel /admin.
-- Para deixar alguém só como aluno: remova do admin_users e use role 'student'.
-- =============================================================================

do $$
declare
  v_email  text;
  v_name   text;
  v_id     uuid;
  v_emails text[] := array[
    'guilherme@chatjuridico.com.br',
    'thayna_oliveira@chatjuridico.com.br',
    'marcos@escritoriovilasboas.com'
  ];
begin
  foreach v_email in array v_emails loop
    v_email := lower(trim(v_email));
    v_name  := split_part(v_email, '@', 1);

    -- 1) auth.users — cria a conta só se o e-mail ainda não existir
    select id into v_id from auth.users where lower(email) = v_email;

    if v_id is null then
      v_id := gen_random_uuid();

      insert into auth.users (
        instance_id, id, aud, role, email,
        encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at,
        -- colunas de token: GoTrue não aceita NULL aqui, usar string vazia
        confirmation_token, recovery_token,
        email_change, email_change_token_new, email_change_token_current,
        phone_change, phone_change_token, reauthentication_token
      ) values (
        '00000000-0000-0000-0000-000000000000',
        v_id, 'authenticated', 'authenticated', v_email,
        null,            -- sem senha: acesso por magic link
        now(),           -- e-mail já confirmado (link chega de imediato)
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name),
        now(), now(),
        '', '', '', '', '', '', '', ''
      );

      -- 2) auth.identities — provider 'email' (consistência do login)
      insert into auth.identities (
        id, provider_id, user_id, identity_data, provider,
        last_sign_in_at, created_at, updated_at
      ) values (
        gen_random_uuid(), v_id::text, v_id,
        jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true),
        'email', now(), now(), now()
      );

      raise notice 'criado   %  id=%', v_email, v_id;
    else
      raise notice 'já existia %  id=%', v_email, v_id;
    end if;

    -- 3) admin_users — libera o painel /admin
    insert into public.admin_users (email, active)
    values (v_email, true)
    on conflict (email) do update set active = true;

    -- 4) public.users — a trigger já criou a linha no insert acima; promove a admin
    update public.users set role = 'admin' where lower(email) = v_email;
  end loop;
end $$;

-- Conferência
select
  u.email,
  u.role,
  (u.email_confirmed_at is not null) as email_confirmado,
  coalesce(a.active, false)          as admin_painel
from public.users u
left join public.admin_users a on lower(a.email) = lower(u.email)
where lower(u.email) in (
  'guilherme@chatjuridico.com.br',
  'thayna_oliveira@chatjuridico.com.br',
  'marcos@escritoriovilasboas.com'
)
order by u.email;
