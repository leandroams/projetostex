import type { Status } from './tipos'

// ---------- status da OS ----------

export const STATUS: Record<Status, { nome: string; cor: string }> = {
  em_analise: { nome: 'Em Análise', cor: 'bg-blue-100 text-blue-800' },
  aguardando_peca: { nome: 'Aguardando Peça', cor: 'bg-yellow-100 text-yellow-800' },
  pronto: { nome: 'Pronto', cor: 'bg-green-100 text-green-800' },
  entregue: { nome: 'Entregue', cor: 'bg-gray-200 text-gray-700' },
}

export const LISTA_STATUS: Status[] = ['em_analise', 'aguardando_peca', 'pronto', 'entregue']

// para onde cada status pode ir (o banco também confere isso no trigger)
export const PROXIMOS: Record<Status, Status[]> = {
  em_analise: ['aguardando_peca', 'pronto'],
  aguardando_peca: ['em_analise', 'pronto'],
  pronto: ['entregue', 'em_analise'],
  entregue: ['pronto'],
}

export function textoBotaoStatus(atual: Status, novo: Status) {
  if (novo === 'aguardando_peca') return 'Aguardar peça'
  if (novo === 'entregue') return 'Registrar entrega'
  if (novo === 'pronto') {
    if (atual === 'entregue') return 'Desfazer entrega'
    return 'Marcar como pronto'
  }
  return 'Voltar para análise'
}

// ---------- formatação ----------

export function moeda(valor: number | null) {
  if (valor == null) return '-'
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function data(iso: string | null) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('pt-BR')
}

export function dataHora(iso: string | null) {
  if (!iso) return '-'
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

// quanto tempo o aparelho está na loja
export function diasNaLoja(iso: string) {
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
  if (dias <= 0) return 'hoje'
  if (dias === 1) return 'há 1 dia'
  return 'há ' + dias + ' dias'
}

export function soNumeros(texto: string) {
  return texto.replace(/\D/g, '')
}

// (41) 98880-6498
export function telefone(texto: string) {
  const n = soNumeros(texto).slice(0, 11)
  if (n.length <= 2) return n
  if (n.length <= 6) return `(${n.slice(0, 2)}) ${n.slice(2)}`
  if (n.length <= 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`
}

export function cpfCnpj(texto: string) {
  const n = soNumeros(texto)
  if (n.length === 11) return n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  if (n.length === 14) return n.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  return n
}

// numero da OS com zeros na frente: 7 -> 00007
export function numOS(numero: number) {
  return String(numero).padStart(5, '0')
}

// campo de valor: aceita "150", "150,50" ou "150.50"
export function textoParaValor(texto: string) {
  if (texto.trim() === '') return null
  const valor = Number(texto.replace(',', '.'))
  if (isNaN(valor) || valor < 0) return null
  return valor
}

export function valorParaTexto(valor: number | null) {
  if (valor == null) return ''
  return valor.toFixed(2).replace('.', ',')
}

// A coluna "busca" das views está em minúsculo e sem acento, então
// faço a mesma coisa com o que foi digitado e separo por palavra.
export function palavrasBusca(texto: string) {
  let t = texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
  // se não tem letra é telefone ou número da OS
  if (!/[a-z]/.test(t)) t = soNumeros(t)
  return t.split(' ').filter((p) => p !== '')
}

export function linkWhatsApp(tel: string, mensagem: string) {
  return 'https://wa.me/55' + soNumeros(tel) + '?text=' + encodeURIComponent(mensagem)
}
