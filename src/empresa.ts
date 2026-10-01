// Dados da loja (aparecem no PDF)
export const EMPRESA = {
  nome: 'STEX Assistência Técnica',
  cnpj: '33.131.985/0001-43',
  telefone: '(41) 98880-6498',
  endereco: '',
}

export const TIPOS_APARELHO = ['Celular', 'Notebook', 'Computador', 'Tablet', 'TV', 'Videogame', 'Monitor', 'Som', 'Outro']

export const FORMAS_PAGAMENTO = ['Pix', 'Dinheiro', 'Cartão de débito', 'Cartão de crédito']

// textos que saem no final dos comprovantes
export const TERMOS_ENTRADA = [
  'Este comprovante deve ser apresentado na retirada do aparelho.',
  'O orçamento é informado ao cliente após a análise e o serviço só é feito com a aprovação.',
  'A loja não se responsabiliza por dados armazenados no aparelho. Faça backup antes do reparo.',
  'Acessórios não listados neste comprovante não foram deixados na loja.',
]

export const TERMOS_SAIDA = [
  'O cliente declara ter recebido o aparelho e conferido o serviço na retirada.',
  'A garantia cobre somente o serviço e as peças descritas neste comprovante.',
  'A garantia não cobre queda, contato com líquido, oscilação de energia ou reparo feito por terceiros.',
]
