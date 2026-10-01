-- ============================================================================
-- STEX - Cadastro de usuários pelo próprio sistema
--
-- Rodar UMA vez no Supabase: SQL Editor > New query > colar tudo > Run.
-- Depois disso os usuários são criados na tela "Usuários" do sistema.
--
-- O login do Supabase é por e-mail, então cada usuário vira
-- "usuario@stex.local" por trás (ex: adewerton -> adewerton@stex.local).
-- Só quem está logado no sistema consegue usar essas funções.
-- ============================================================================

-- lista os usuários cadastrados
create or replace function public.listar_usuarios()
returns table (id uuid, usuario text, criado_em timestamptz, ultimo_acesso timestamptz)
language sql
security definer
set search_path = public, extensions
as $$
  select u.id, replace(u.email, '@stex.local', '')::text, u.created_at, u.last_sign_in_at
  from auth.users u
  where auth.uid() is not null
  order by u.email;
$$;

-- cria um usuário novo
create or replace function public.criar_usuario(p_usuario text, p_senha text)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_id uuid := gen_random_uuid();
  v_usuario text := lower(trim(p_usuario));
  v_email text;
begin
  if auth.uid() is null then
    raise exception 'Faça login para cadastrar usuários.';
  end if;
  if v_usuario !~ '^[a-z0-9._-]{3,30}$' then
    raise exception 'O usuário deve ter de 3 a 30 caracteres, só letras sem acento, números, ponto ou traço.';
  end if;
  if length(p_senha) < 6 then
    raise exception 'A senha precisa ter pelo menos 6 caracteres.';
  end if;

  v_email := v_usuario || '@stex.local';
  if exists (select 1 from auth.users where email = v_email) then
    raise exception 'Já existe um usuário com esse nome.';
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change, email_change_token_new
  ) values (
    '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_email,
    crypt(p_senha, gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now(),
    '', '', '', ''
  );

  insert into auth.identities (
    id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), v_id, v_id::text, 'email',
    jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true, 'phone_verified', false),
    now(), now(), now()
  );

  return v_id;
end $$;

-- troca a senha de um usuário
create or replace function public.trocar_senha_usuario(p_id uuid, p_senha text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if auth.uid() is null then
    raise exception 'Faça login para trocar senhas.';
  end if;
  if length(p_senha) < 6 then
    raise exception 'A senha precisa ter pelo menos 6 caracteres.';
  end if;

  update auth.users
     set encrypted_password = crypt(p_senha, gen_salt('bf')), updated_at = now()
   where id = p_id;

  if not found then
    raise exception 'Usuário não encontrado.';
  end if;
end $$;

-- exclui um usuário (não deixa excluir o próprio)
create or replace function public.excluir_usuario(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if auth.uid() is null then
    raise exception 'Faça login para excluir usuários.';
  end if;
  if p_id = auth.uid() then
    raise exception 'Você não pode excluir o seu próprio usuário.';
  end if;

  delete from auth.users where id = p_id;
end $$;

-- só usuário logado pode chamar
revoke execute on function public.listar_usuarios() from public, anon;
revoke execute on function public.criar_usuario(text, text) from public, anon;
revoke execute on function public.trocar_senha_usuario(uuid, text) from public, anon;
revoke execute on function public.excluir_usuario(uuid) from public, anon;

grant execute on function public.listar_usuarios() to authenticated;
grant execute on function public.criar_usuario(text, text) to authenticated;
grant execute on function public.trocar_senha_usuario(uuid, text) to authenticated;
grant execute on function public.excluir_usuario(uuid) to authenticated;
