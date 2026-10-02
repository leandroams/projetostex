// Gera os comprovantes de entrada e saída usando a biblioteca jsPDF
import { jsPDF } from 'jspdf'
import { EMPRESA, TERMOS_ENTRADA, TERMOS_SAIDA } from './empresa'
import type { OrdemServico } from './tipos'
import { cpfCnpj, dataHora, moeda, numOS, telefone } from './utils'

export function gerarPDF(tipo: 'entrada' | 'saida', os: OrdemServico) {
  const doc = new jsPDF() // A4, medidas em mm
  const aparelho = os.aparelho
  const cliente = aparelho.cliente
  let y = 20 // posição vertical, vou somando a cada linha

  // se não couber mais na folha, começa outra página
  function conferirEspaco(altura: number) {
    if (y + altura > 280) {
      doc.addPage()
      y = 20
    }
  }

  function secao(titulo: string) {
    conferirEspaco(20)
    y += 4
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(titulo, 15, y)
    doc.line(15, y + 1.5, 195, y + 1.5)
    y += 8
  }

  // escreve "Rótulo: valor" e quebra a linha se o texto for grande
  function campo(rotulo: string, valor: string | null) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const linhas = doc.splitTextToSize(valor || '-', 135)
    conferirEspaco(linhas.length * 5 + 1)
    doc.setFont('helvetica', 'bold')
    doc.text(rotulo + ':', 15, y)
    doc.setFont('helvetica', 'normal')
    doc.text(linhas, 58, y)
    y += linhas.length * 5 + 1
  }

  // ----- cabeçalho -----
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(EMPRESA.nome, 15, y)
  doc.text('OS Nº ' + numOS(os.numero), 195, y, { align: 'right' })
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('CNPJ ' + EMPRESA.cnpj + '  -  Tel. ' + EMPRESA.telefone, 15, y)
  if (EMPRESA.endereco) {
    y += 4
    doc.text(EMPRESA.endereco, 15, y)
  }
  y += 10
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text(tipo === 'entrada' ? 'COMPROVANTE DE ENTRADA' : 'COMPROVANTE DE SAÍDA', 105, y, { align: 'center' })
  y += 6

  // ----- cliente e aparelho -----
  secao('Cliente')
  campo('Nome', cliente.nome)
  campo('Telefone', telefone(cliente.telefone))
  if (cliente.cpf_cnpj) campo('CPF/CNPJ', cpfCnpj(cliente.cpf_cnpj))
  if (cliente.endereco) campo('Endereço', cliente.endereco)

  secao('Aparelho')
  campo('Aparelho', aparelho.tipo + ' ' + aparelho.marca + ' ' + aparelho.modelo)
  campo('Nº de série / IMEI', aparelho.numero_serie)
  campo('Acessórios', os.acessorios || 'Nenhum')

  // ----- dados do serviço -----
  let termos = TERMOS_ENTRADA

  if (tipo === 'entrada') {
    secao('Atendimento')
    campo('Data de entrada', dataHora(os.aberta_em))
    campo('Defeito relatado', os.defeito_relatado)
    campo('Orçamento prévio', os.valor_orcamento == null ? 'A definir após análise' : moeda(os.valor_orcamento))
    if (os.observacoes) campo('Observações', os.observacoes)
  } else {
    termos = TERMOS_SAIDA
    secao('Serviço')
    campo('Data de entrada', dataHora(os.aberta_em))
    campo('Data de entrega', dataHora(os.entregue_em))
    campo('Defeito relatado', os.defeito_relatado)
    campo('Diagnóstico', os.diagnostico)
    campo('Serviço realizado', os.servico_realizado)

    secao('Valores e garantia')
    campo('Valor total', moeda(os.valor_final))
    campo('Forma de pagamento', os.forma_pagamento)
    campo('Garantia', os.garantia_dias > 0 ? os.garantia_dias + ' dias a partir da entrega' : 'Sem garantia')
  }

  // ----- condições -----
  secao('Condições')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  for (const termo of termos) {
    const linhas = doc.splitTextToSize('- ' + termo, 180)
    doc.text(linhas, 15, y)
    y += linhas.length * 4
  }

  // ----- assinaturas -----
  // se o texto ficou grande demais, joga as assinaturas pra outra página
  if (y > 250) {
    doc.addPage()
    y = 20
  }
  y += 25
  doc.line(15, y, 95, y)
  doc.line(115, y, 195, y)
  doc.setFontSize(9)
  doc.text('Assinatura do cliente', 55, y + 5, { align: 'center' })
  doc.text(EMPRESA.nome, 155, y + 5, { align: 'center' })

  doc.save('OS-' + numOS(os.numero) + '-' + tipo + '.pdf')
}
