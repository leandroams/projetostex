-- Banco de dados do sistema da STEX (Supabase / PostgreSQL)
--
-- Para usar: no Supabase abrir o SQL Editor, colar este arquivo e clicar em Run.
-- Pode rodar mais de uma vez que não apaga os dados.
--
-- Tabelas: clientes -> aparelhos -> ordens_servico -> os_historico
-- (um cliente tem vários aparelhos, um aparelho tem várias OS)

-- extensão para a busca funcionar sem acento
create schema if not exists extensions;
create extension if not exists unaccent with schema extensions;

-- status possíveis da OS
do $$
begin
  create type public.status_os as enum ('em_analise', 'aguardando_peca', 'pronto', 'entregue');
exception
  when duplicate_object then null;
end $$;

-- ---------- tabelas ----------

create table if not exists public.clientes (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null check (length(trim(nome)) > 0),
  telefone    text not null check (length(trim(telefone)) > 0),
  email       text,
  cpf_cnpj    text,
  endereco    text,
  observacoes text,
  criado_em   timestamptz not null default now()
);

create table if not exists public.aparelhos (
  id           uuid primary key default gen_random_uuid(),
  -- se excluir o cliente apaga os aparelhos dele junto
  cliente_id   uuid not null references public.clientes (id) on delete cascade,
  tipo         text not null check (length(trim(tipo)) > 0),
  marca        text not null check (length(trim(marca)) > 0),
  modelo       text not null check (length(trim(modelo)) > 0),
  numero_serie text,
  observacoes  text,
  criado_em    timestamptz not null default now()
);

create table if not exists public.ordens_servico (
  id                 uuid primary key default gen_random_uuid(),
  numero             bigint generated always as identity unique,
  -- restrict: não deixa excluir aparelho (nem cliente) que já tem OS
  aparelho_id        uuid not null references public.aparelhos (id) on delete restrict,
  status             public.status_os not null default 'em_analise',
  defeito_relatado   text not null check (length(trim(defeito_relatado)) > 0),
  acessorios         text,
  diagnostico        text,
  servico_realizado  text,
  valor_orcamento    numeric(10, 2) check (valor_orcamento >= 0),
  orcamento_aprovado boolean not null default false,
  valor_final        numeric(10, 2) check (valor_final >= 0),
  forma_pagamento    text,
  garantia_dias      integer not null default 90 check (garantia_dias >= 0),
  observacoes        text,
  aberta_em          timestamptz not null default now(),
  entregue_em        timestamptz,
  atualizado_em      timestamptz not null default now()
);

create table if not exists public.os_historico (
  id              uuid primary key default gen_random_uuid(),
  os_id           uuid not null references public.ordens_servico (id) on delete cascade,
  status_anterior public.status_os,
  status_novo     public.status_os not null,
  observacao      text,
  usuario_id      uuid,
  usuario_email   text,
  criado_em       timestamptz not null default now()
);

create index if not exists aparelhos_cliente_id_idx on public.aparelhos (cliente_id);
create index if not exists ordens_servico_aparelho_id_idx on public.ordens_servico (aparelho_id);
create index if not exists ordens_servico_status_idx on public.ordens_servico (status);
create index if not exists ordens_servico_aberta_em_idx on public.ordens_servico (aberta_em desc);
create index if not exists os_historico_os_id_idx on public.os_historico (os_id, criado_em);

-- ---------- regras de status da OS ----------
--
-- Mudanças permitidas:
--   em_analise      -> aguardando_peca ou pronto
--   aguardando_peca -> em_analise ou pronto
--   pronto          -> entregue (precisa do valor final) ou em_analise
--   entregue        -> pronto (para desfazer uma entrega marcada errado)

-- toda OS nova começa em análise
create or replace function public.os_antes_de_inserir()
returns trigger
language plpgsql
as $$
begin
  new.status := 'em_analise';
  new.entregue_em := null;
  return new;
end $$;

-- confere se a mudança de status é permitida antes de salvar
create or replace function public.os_antes_de_atualizar()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status then
    if not (
      (old.status = 'em_analise' and new.status in ('aguardando_peca', 'pronto'))
      or (old.status = 'aguardando_peca' and new.status in ('em_analise', 'pronto'))
      or (old.status = 'pronto' and new.status in ('entregue', 'em_analise'))
      or (old.status = 'entregue' and new.status = 'pronto')
    ) then
      raise exception 'Mudança de status não permitida: % → %.', old.status, new.status;
    end if;

    if new.status = 'entregue' then
      if new.valor_final is null then
        raise exception 'Informe o valor final para registrar a entrega.';
      end if;
      new.entregue_em := now();
    else
      new.entregue_em := null;
    end if;
  elsif old.status = 'entregue' then
    raise exception 'Esta OS já foi entregue e não pode ser alterada. Desfaça a entrega para editar.';
  end if;

  new.aparelho_id := old.aparelho_id;
  new.aberta_em := old.aberta_em;
  new.atualizado_em := now();
  return new;
end $$;

-- grava o histórico quando a OS é aberta e quando muda de status
-- (security definer porque os usuários só têm permissão de leitura no histórico)
create or replace function public.os_registrar_historico()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.os_historico (os_id, status_anterior, status_novo, observacao, usuario_id, usuario_email)
    values (new.id, null, new.status, 'OS aberta', auth.uid(), auth.jwt() ->> 'email');
  elsif new.status is distinct from old.status then
    insert into public.os_historico (os_id, status_anterior, status_novo, observacao, usuario_id, usuario_email)
    values (
      new.id, old.status, new.status,
      nullif(current_setting('stex.obs_status', true), ''),
      auth.uid(), auth.jwt() ->> 'email'
    );
  end if;
  return null;
end $$;

drop trigger if exists os_antes_de_inserir on public.ordens_servico;
create trigger os_antes_de_inserir
  before insert on public.ordens_servico
  for each row execute function public.os_antes_de_inserir();

drop trigger if exists os_antes_de_atualizar on public.ordens_servico;
create trigger os_antes_de_atualizar
  before update on public.ordens_servico
  for each row execute function public.os_antes_de_atualizar();

drop trigger if exists os_registrar_historico on public.ordens_servico;
create trigger os_registrar_historico
  after insert or update on public.ordens_servico
  for each row execute function public.os_registrar_historico();

-- função que o sistema chama para mudar o status
-- na entrega grava também o valor final, o pagamento e a garantia
create or replace function public.mudar_status_os(
  p_os_id           uuid,
  p_novo_status     public.status_os,
  p_observacao      text default null,
  p_valor_final     numeric default null,
  p_forma_pagamento text default null,
  p_garantia_dias   integer default null
)
returns public.ordens_servico
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_os public.ordens_servico;
begin
  perform set_config('stex.obs_status', coalesce(trim(p_observacao), ''), true);

  update public.ordens_servico
     set status          = p_novo_status,
         valor_final     = coalesce(p_valor_final, valor_final),
         forma_pagamento = coalesce(p_forma_pagamento, forma_pagamento),
         garantia_dias   = coalesce(p_garantia_dias, garantia_dias)
   where id = p_os_id
  returning * into v_os;

  perform set_config('stex.obs_status', '', true);

  if v_os.id is null then
    raise exception 'Ordem de serviço não encontrada.';
  end if;
  return v_os;
end $$;

-- ---------- views usadas nas listas ----------
-- a coluna "busca" junta os campos em minúsculo e sem acento para a pesquisa

create or replace view public.vw_clientes
with (security_invoker = true) as
select
  c.id, c.nome, c.telefone, c.email, c.cpf_cnpj, c.endereco, c.observacoes, c.criado_em,
  (select count(*) from public.aparelhos a where a.cliente_id = c.id)::int as total_aparelhos,
  lower(extensions.unaccent(concat_ws(' ', c.nome, c.telefone, c.cpf_cnpj, c.email))) as busca
from public.clientes c;

create or replace view public.vw_ordens_servico
with (security_invoker = true) as
select
  o.id, o.numero, o.status, o.defeito_relatado,
  o.valor_orcamento, o.orcamento_aprovado, o.valor_final,
  o.aberta_em, o.entregue_em, o.atualizado_em,
  a.id as aparelho_id,
  concat_ws(' ', a.tipo, a.marca, a.modelo) as aparelho_descricao,
  c.id as cliente_id,
  c.nome as cliente_nome,
  c.telefone as cliente_telefone,
  lower(extensions.unaccent(concat_ws(' ',
    o.numero::text, c.nome, c.telefone, a.tipo, a.marca, a.modelo, a.numero_serie
  ))) as busca
from public.ordens_servico o
join public.aparelhos a on a.id = o.aparelho_id
join public.clientes c on c.id = a.cliente_id;

-- ---------- segurança ----------
-- só quem fez login consegue ler e gravar os dados

alter table public.clientes       enable row level security;
alter table public.aparelhos      enable row level security;
alter table public.ordens_servico enable row level security;
alter table public.os_historico   enable row level security;

drop policy if exists "autenticados gerenciam clientes" on public.clientes;
create policy "autenticados gerenciam clientes" on public.clientes
  for all to authenticated using (true) with check (true);

drop policy if exists "autenticados gerenciam aparelhos" on public.aparelhos;
create policy "autenticados gerenciam aparelhos" on public.aparelhos
  for all to authenticated using (true) with check (true);

drop policy if exists "autenticados gerenciam ordens" on public.ordens_servico;
create policy "autenticados gerenciam ordens" on public.ordens_servico
  for all to authenticated using (true) with check (true);

drop policy if exists "autenticados leem historico" on public.os_historico;
create policy "autenticados leem historico" on public.os_historico
  for select to authenticated using (true);

revoke all on public.clientes, public.aparelhos, public.ordens_servico, public.os_historico,
              public.vw_clientes, public.vw_ordens_servico from anon;
revoke execute on function public.mudar_status_os(uuid, public.status_os, text, numeric, text, integer) from public, anon;

grant select, insert, update, delete on public.clientes, public.aparelhos to authenticated;
grant select, insert, update on public.ordens_servico to authenticated;
grant select on public.os_historico, public.vw_clientes, public.vw_ordens_servico to authenticated;
grant execute on function public.mudar_status_os(uuid, public.status_os, text, numeric, text, integer) to authenticated;
