export type Status = 'em_analise' | 'aguardando_peca' | 'pronto' | 'entregue'

export type Cliente = {
  id: string
  nome: string
  telefone: string
  email: string | null
  cpf_cnpj: string | null
  endereco: string | null
  observacoes: string | null
  criado_em: string
}

export type Aparelho = {
  id: string
  cliente_id: string
  tipo: string
  marca: string
  modelo: string
  numero_serie: string | null
  observacoes: string | null
}

export type OrdemServico = {
  id: string
  numero: number
  aparelho_id: string
  status: Status
  defeito_relatado: string
  acessorios: string | null
  diagnostico: string | null
  servico_realizado: string | null
  valor_orcamento: number | null
  orcamento_aprovado: boolean
  valor_final: number | null
  forma_pagamento: string | null
  garantia_dias: number
  observacoes: string | null
  aberta_em: string
  entregue_em: string | null
  // vem junto na consulta da OS
  aparelho: Aparelho & { cliente: Cliente }
}

// linha da view vw_ordens_servico (usada nas listas)
export type OSLista = {
  id: string
  numero: number
  status: Status
  defeito_relatado: string
  aberta_em: string
  entregue_em: string | null
  aparelho_descricao: string
  cliente_id: string
  cliente_nome: string
  cliente_telefone: string
}

export type Historico = {
  id: string
  status_anterior: Status | null
  status_novo: Status
  observacao: string | null
  usuario_email: string | null
  criado_em: string
}
