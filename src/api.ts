// Todas as consultas ao banco ficam aqui
import { supabase } from './supabase'
import { palavrasBusca } from './utils'
import type { Aparelho, Cliente, Historico, OrdemServico, OSLista, Status } from './tipos'

// transforma o erro do supabase em uma mensagem que dá pra mostrar na tela
function tratarErro(error: { code?: string; message: string }) {
  if (error.code === '23503') {
    return new Error('Não dá para excluir: existe ordem de serviço ligada a esse cadastro.')
  }
  // PGRST202 = a função ainda não existe no banco
  if (error.code === 'PGRST202') {
    return new Error('Falta rodar o arquivo supabase/usuarios.sql no Supabase (só uma vez).')
  }
  if (error.message.includes('Failed to fetch')) {
    return new Error('Sem conexão com o servidor. Verifique a internet.')
  }
  return new Error(error.message)
}

// ---------- clientes ----------

export async function listarClientes(busca = '') {
  let consulta = supabase.from('vw_clientes').select('*').order('nome').limit(200)
  for (const palavra of palavrasBusca(busca)) {
    consulta = consulta.ilike('busca', '%' + palavra + '%')
  }
  const { data, error } = await consulta
  if (error) throw tratarErro(error)
  return data as (Cliente & { total_aparelhos: number })[]
}

export async function buscarCliente(id: string) {
  const { data, error } = await supabase.from('clientes').select('*').eq('id', id).single()
  if (error) throw tratarErro(error)
  return data as Cliente
}

// se passar o id atualiza, senão cria um novo
export async function salvarCliente(dados: Omit<Cliente, 'id' | 'criado_em'>, id?: string) {
  if (id) {
    const { data, error } = await supabase.from('clientes').update(dados).eq('id', id).select().single()
    if (error) throw tratarErro(error)
    return data as Cliente
  }
  const { data, error } = await supabase.from('clientes').insert(dados).select().single()
  if (error) throw tratarErro(error)
  return data as Cliente
}

export async function excluirCliente(id: string) {
  const { error } = await supabase.from('clientes').delete().eq('id', id)
  if (error) throw tratarErro(error)
}

// ---------- aparelhos ----------

export async function listarAparelhos(clienteId: string) {
  const { data, error } = await supabase.from('aparelhos').select('*').eq('cliente_id', clienteId).order('criado_em')
  if (error) throw tratarErro(error)
  return data as Aparelho[]
}

export async function salvarAparelho(dados: Omit<Aparelho, 'id'>, id?: string) {
  if (id) {
    const { data, error } = await supabase.from('aparelhos').update(dados).eq('id', id).select().single()
    if (error) throw tratarErro(error)
    return data as Aparelho
  }
  const { data, error } = await supabase.from('aparelhos').insert(dados).select().single()
  if (error) throw tratarErro(error)
  return data as Aparelho
}

export async function excluirAparelho(id: string) {
  const { error } = await supabase.from('aparelhos').delete().eq('id', id)
  if (error) throw tratarErro(error)
}

// ---------- ordens de serviço ----------

// status pode ser um dos 4, "abertas" (tudo menos entregue) ou "todas"
export async function listarOS(status = 'todas', busca = '', clienteId = '') {
  let consulta = supabase.from('vw_ordens_servico').select('*').order('numero', { ascending: false }).limit(200)

  if (status === 'abertas') consulta = consulta.neq('status', 'entregue')
  else if (status !== 'todas') consulta = consulta.eq('status', status)

  if (clienteId) consulta = consulta.eq('cliente_id', clienteId)

  for (const palavra of palavrasBusca(busca)) {
    consulta = consulta.ilike('busca', '%' + palavra + '%')
  }

  const { data, error } = await consulta
  if (error) throw tratarErro(error)
  return data as OSLista[]
}

export async function buscarOS(id: string) {
  const { data, error } = await supabase
    .from('ordens_servico')
    .select('*, aparelho:aparelhos(*, cliente:clientes(*))')
    .eq('id', id)
    .single()
  if (error) throw tratarErro(error)
  return data as OrdemServico
}

export async function abrirOS(dados: {
  aparelho_id: string
  defeito_relatado: string
  acessorios: string | null
  observacoes: string | null
  valor_orcamento: number | null
}) {
  const { data, error } = await supabase.from('ordens_servico').insert(dados).select('id').single()
  if (error) throw tratarErro(error)
  return data.id as string
}

export async function atualizarOS(
  id: string,
  dados: {
    defeito_relatado: string
    acessorios: string | null
    diagnostico: string | null
    servico_realizado: string | null
    valor_orcamento: number | null
    orcamento_aprovado: boolean
    observacoes: string | null
  },
) {
  const { error } = await supabase.from('ordens_servico').update(dados).eq('id', id)
  if (error) throw tratarErro(error)
}

// A mudança de status é feita por uma função do banco (mudar_status_os),
// que valida a transição e grava o histórico.
// Os dados de entrega só são usados quando o status novo é "entregue".
export async function mudarStatus(
  id: string,
  status: Status,
  observacao: string,
  entrega?: { valor_final: number; forma_pagamento: string; garantia_dias: number },
) {
  const { error } = await supabase.rpc('mudar_status_os', {
    p_os_id: id,
    p_novo_status: status,
    p_observacao: observacao || null,
    p_valor_final: entrega ? entrega.valor_final : null,
    p_forma_pagamento: entrega ? entrega.forma_pagamento : null,
    p_garantia_dias: entrega ? entrega.garantia_dias : null,
  })
  if (error) throw tratarErro(error)
}

export async function listarHistorico(osId: string) {
  const { data, error } = await supabase
    .from('os_historico')
    .select('*')
    .eq('os_id', osId)
    .order('criado_em', { ascending: false })
  if (error) throw tratarErro(error)
  return data as Historico[]
}

// ---------- usuários do sistema ----------
// usam as funções do arquivo supabase/usuarios.sql

export type Usuario = {
  id: string
  usuario: string
  criado_em: string
  ultimo_acesso: string | null
}

export async function listarUsuarios() {
  const { data, error } = await supabase.rpc('listar_usuarios')
  if (error) throw tratarErro(error)
  return data as Usuario[]
}

export async function criarUsuario(usuario: string, senha: string) {
  const { error } = await supabase.rpc('criar_usuario', { p_usuario: usuario, p_senha: senha })
  if (error) throw tratarErro(error)
}

export async function trocarSenhaUsuario(id: string, senha: string) {
  const { error } = await supabase.rpc('trocar_senha_usuario', { p_id: id, p_senha: senha })
  if (error) throw tratarErro(error)
}

export async function excluirUsuario(id: string) {
  const { error } = await supabase.rpc('excluir_usuario', { p_id: id })
  if (error) throw tratarErro(error)
}

// ---------- financeiro ----------

export type ServicoEntregue = {
  id: string
  numero: number
  valor_final: number | null
  forma_pagamento: string | null
  entregue_em: string
  servico_realizado: string | null
  aparelho: { tipo: string; marca: string; modelo: string; cliente: { nome: string } }
}

// OS entregues dentro do mês (mes no formato "2026-10")
export async function listarEntreguesDoMes(mes: string) {
  const [ano, numeroMes] = mes.split('-').map(Number)
  const inicio = new Date(ano, numeroMes - 1, 1)
  const fim = new Date(ano, numeroMes, 1) // primeiro dia do mês seguinte

  const { data, error } = await supabase
    .from('ordens_servico')
    .select('id, numero, valor_final, forma_pagamento, entregue_em, servico_realizado, aparelho:aparelhos(tipo, marca, modelo, cliente:clientes(nome))')
    .eq('status', 'entregue')
    .gte('entregue_em', inicio.toISOString())
    .lt('entregue_em', fim.toISOString())
    .order('entregue_em', { ascending: false })
  if (error) throw tratarErro(error)
  return data as unknown as ServicoEntregue[]
}
