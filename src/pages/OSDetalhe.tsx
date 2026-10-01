import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { atualizarOS, buscarOS, listarHistorico, mudarStatus } from '../api'
import Modal from '../components/Modal'
import SeloStatus from '../components/SeloStatus'
import { FORMAS_PAGAMENTO } from '../empresa'
import { gerarPDF } from '../pdf'
import { emailParaUsuario } from '../supabase'
import type { Historico, OrdemServico, Status } from '../tipos'
import { dataHora, linkWhatsApp, moeda, numOS, PROXIMOS, STATUS, telefone, textoBotaoStatus, textoParaValor, valorParaTexto } from '../utils'

export default function OSDetalhe() {
  const { id } = useParams()

  const [os, setOs] = useState<OrdemServico | null>(null)
  const [historico, setHistorico] = useState<Historico[]>([])
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [salvando, setSalvando] = useState(false)

  // campos do formulário
  const [defeito, setDefeito] = useState('')
  const [diagnostico, setDiagnostico] = useState('')
  const [servico, setServico] = useState('')
  const [orcamento, setOrcamento] = useState('')
  const [aprovado, setAprovado] = useState(false)
  const [acessorios, setAcessorios] = useState('')
  const [observacoes, setObservacoes] = useState('')

  // janela de mudança de status
  const [novoStatus, setNovoStatus] = useState<Status | null>(null)
  const [obsStatus, setObsStatus] = useState('')
  const [valorFinal, setValorFinal] = useState('')
  const [pagamento, setPagamento] = useState(FORMAS_PAGAMENTO[0])
  const [garantia, setGarantia] = useState('90')
  const [erroStatus, setErroStatus] = useState('')

  async function carregar() {
    try {
      const dados = await buscarOS(id!)
      setOs(dados)
      setHistorico(await listarHistorico(id!))

      // preenche o formulário com o que está salvo
      setDefeito(dados.defeito_relatado)
      setDiagnostico(dados.diagnostico ?? '')
      setServico(dados.servico_realizado ?? '')
      setOrcamento(valorParaTexto(dados.valor_orcamento))
      setAprovado(dados.orcamento_aprovado)
      setAcessorios(dados.acessorios ?? '')
      setObservacoes(dados.observacoes ?? '')
    } catch (err: any) {
      setErro(err.message)
    }
  }

  useEffect(() => {
    carregar()
  }, [id])

  // salva os campos do formulário. retorna true se deu certo
  async function salvarDados() {
    if (defeito.trim() === '') {
      setErro('O defeito relatado não pode ficar vazio.')
      return false
    }
    if (orcamento.trim() !== '' && textoParaValor(orcamento) == null) {
      setErro('Valor do orçamento inválido.')
      return false
    }
    try {
      await atualizarOS(id!, {
        defeito_relatado: defeito.trim(),
        diagnostico: diagnostico.trim() || null,
        servico_realizado: servico.trim() || null,
        valor_orcamento: textoParaValor(orcamento),
        orcamento_aprovado: aprovado,
        acessorios: acessorios.trim() || null,
        observacoes: observacoes.trim() || null,
      })
      setErro('')
      return true
    } catch (err: any) {
      setErro(err.message)
      return false
    }
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setMensagem('')
    const deuCerto = await salvarDados()
    if (deuCerto) {
      setMensagem('Alterações salvas!')
      await carregar()
    }
    setSalvando(false)
  }

  function abrirJanelaStatus(status: Status) {
    setNovoStatus(status)
    setObsStatus('')
    setErroStatus('')
    setValorFinal(orcamento) // já sugere o valor do orçamento
  }

  async function confirmarStatus(e: React.FormEvent) {
    e.preventDefault()
    if (!os || !novoStatus) return

    let entrega
    if (novoStatus === 'entregue') {
      const valor = textoParaValor(valorFinal)
      if (valor == null) {
        setErroStatus('Informe o valor final (pode ser 0 se não cobrou).')
        return
      }
      const dias = Number(garantia)
      if (garantia === '' || isNaN(dias) || dias < 0) {
        setErroStatus('Informe os dias de garantia (0 = sem garantia).')
        return
      }
      entrega = { valor_final: valor, forma_pagamento: pagamento, garantia_dias: dias }
    }

    setSalvando(true)
    try {
      // antes de mudar o status salva o que foi digitado no formulário,
      // senão o diagnóstico/valor se perdem (OS entregue não pode ser editada)
      if (os.status !== 'entregue') {
        const deuCerto = await salvarDados()
        if (!deuCerto) {
          setNovoStatus(null)
          setSalvando(false)
          return
        }
      }
      await mudarStatus(os.id, novoStatus, obsStatus.trim(), entrega)
      setNovoStatus(null)
      setMensagem('Status alterado para ' + STATUS[novoStatus].nome + '.')
      await carregar()
    } catch (err: any) {
      setErroStatus(err.message)
    }
    setSalvando(false)
  }

  function mensagemWhatsApp() {
    if (!os) return ''
    const nome = os.aparelho.cliente.nome.split(' ')[0]
    const aparelho = os.aparelho.marca + ' ' + os.aparelho.modelo
    let texto = 'Olá, ' + nome + '! Aqui é da STEX Assistência Técnica. '
    if (os.status === 'pronto') {
      texto += 'Seu ' + aparelho + ' (OS ' + numOS(os.numero) + ') está pronto para retirada.'
      if (os.valor_orcamento != null) texto += ' Valor: ' + moeda(os.valor_orcamento) + '.'
    } else if (os.valor_orcamento != null && !os.orcamento_aprovado && os.status !== 'entregue') {
      texto += 'O orçamento do seu ' + aparelho + ' ficou em ' + moeda(os.valor_orcamento) + '. Podemos fazer o serviço?'
    } else {
      texto += 'Estou entrando em contato sobre o seu ' + aparelho + ' (OS ' + numOS(os.numero) + ').'
    }
    return texto
  }

  if (!os) {
    if (erro) return <p className="erro">{erro}</p>
    return <p>Carregando...</p>
  }

  const cliente = os.aparelho.cliente
  const entregue = os.status === 'entregue'

  return (
    <div>
      <Link to="/os" className="text-blue-700 hover:underline">
        &larr; Voltar
      </Link>

      <div className="my-4 flex flex-wrap items-center gap-3">
        <h1 className="titulo">OS {numOS(os.numero)}</h1>
        <SeloStatus status={os.status} />
        <span className="text-sm text-gray-600">Aberta em {dataHora(os.aberta_em)}</span>
      </div>

      {mensagem && <p className="mb-4 rounded bg-green-100 p-3 text-green-800">{mensagem}</p>}

      {/* ---------- status ---------- */}
      <div className="cartao mb-4">
        <h2 className="mb-2 text-lg font-bold">Mudar status</h2>
        <div className="flex flex-wrap gap-2">
          {PROXIMOS[os.status].map((s) => (
            <button key={s} className={s === 'pronto' || s === 'entregue' ? 'botao' : 'botao-cinza'} onClick={() => abrirJanelaStatus(s)}>
              {textoBotaoStatus(os.status, s)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* ---------- formulário do serviço ---------- */}
        <form onSubmit={salvar} className="cartao space-y-3 md:col-span-2">
          <h2 className="text-lg font-bold">Serviço</h2>

          {entregue && (
            <div className="rounded bg-gray-100 p-3 text-sm">
              <p>
                <b>Entregue em:</b> {dataHora(os.entregue_em)}
              </p>
              <p>
                <b>Valor final:</b> {moeda(os.valor_final)} ({os.forma_pagamento})
              </p>
              <p>
                <b>Garantia:</b> {os.garantia_dias} dias
              </p>
              <p className="mt-1 text-gray-600">OS entregue não pode ser editada. Para corrigir use "Desfazer entrega".</p>
            </div>
          )}

          <div>
            <label className="rotulo">Defeito relatado pelo cliente *</label>
            <textarea className="campo" rows={2} value={defeito} onChange={(e) => setDefeito(e.target.value)} disabled={entregue} />
          </div>
          <div>
            <label className="rotulo">Diagnóstico técnico</label>
            <textarea className="campo" rows={3} value={diagnostico} onChange={(e) => setDiagnostico(e.target.value)} disabled={entregue} />
          </div>
          <div>
            <label className="rotulo">Serviço realizado</label>
            <textarea className="campo" rows={3} value={servico} onChange={(e) => setServico(e.target.value)} disabled={entregue} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="rotulo">Valor do orçamento (R$)</label>
              <input
                className="campo"
                inputMode="decimal"
                placeholder="0,00"
                value={orcamento}
                onChange={(e) => setOrcamento(e.target.value)}
                disabled={entregue}
              />
            </div>
            <label className="flex items-center gap-2 sm:mt-6">
              <input type="checkbox" checked={aprovado} onChange={(e) => setAprovado(e.target.checked)} disabled={entregue} />
              Orçamento aprovado pelo cliente
            </label>
          </div>

          <div>
            <label className="rotulo">Acessórios deixados</label>
            <input className="campo" value={acessorios} onChange={(e) => setAcessorios(e.target.value)} disabled={entregue} />
          </div>
          <div>
            <label className="rotulo">Observações</label>
            <textarea className="campo" rows={2} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} disabled={entregue} />
          </div>

          {erro && <p className="erro">{erro}</p>}

          {!entregue && (
            <button className="botao" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          )}
        </form>

        {/* ---------- coluna da direita ---------- */}
        <div className="space-y-4">
          <div className="cartao">
            <h2 className="mb-2 text-lg font-bold">Cliente</h2>
            <Link to={'/clientes/' + cliente.id} className="font-semibold text-blue-700 hover:underline">
              {cliente.nome}
            </Link>
            <p>{telefone(cliente.telefone)}</p>
            <a
              href={linkWhatsApp(cliente.telefone, mensagemWhatsApp())}
              target="_blank"
              className="mt-2 inline-block rounded bg-green-600 px-3 py-1 text-sm font-medium text-white hover:bg-green-700"
            >
              Avisar pelo WhatsApp
            </a>

            <h2 className="mt-4 mb-2 text-lg font-bold">Aparelho</h2>
            <p>
              {os.aparelho.tipo} - {os.aparelho.marca} {os.aparelho.modelo}
            </p>
            {os.aparelho.numero_serie && <p className="text-sm text-gray-600">Série/IMEI: {os.aparelho.numero_serie}</p>}
          </div>

          <div className="cartao">
            <h2 className="mb-2 text-lg font-bold">Comprovantes (PDF)</h2>
            <button className="botao-cinza mb-2 w-full" onClick={() => gerarPDF('entrada', os)}>
              Comprovante de entrada
            </button>
            <button className="botao-cinza w-full" onClick={() => gerarPDF('saida', os)} disabled={!entregue}>
              Comprovante de saída
            </button>
            {!entregue && <p className="mt-1 text-sm text-gray-500">O de saída libera depois da entrega.</p>}
          </div>

          <div className="cartao">
            <h2 className="mb-2 text-lg font-bold">Histórico</h2>
            {historico.map((h) => (
              <div key={h.id} className="mb-3 border-l-2 border-gray-300 pl-3 text-sm">
                <b>{h.status_anterior ? STATUS[h.status_anterior].nome + ' → ' + STATUS[h.status_novo].nome : 'OS aberta'}</b>
                {h.status_anterior && h.observacao && <p>{h.observacao}</p>}
                <p className="text-gray-500">
                  {dataHora(h.criado_em)} - {emailParaUsuario(h.usuario_email)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- janela de mudança de status ---------- */}
      {novoStatus && (
        <Modal titulo={textoBotaoStatus(os.status, novoStatus)} fechar={() => setNovoStatus(null)}>
          <form onSubmit={confirmarStatus} className="space-y-3">
            <p>
              Mudar de <b>{STATUS[os.status].nome}</b> para <b>{STATUS[novoStatus].nome}</b>.
            </p>

            {novoStatus === 'entregue' && (
              <>
                <div>
                  <label className="rotulo">Valor final cobrado (R$) *</label>
                  <input
                    className="campo"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={valorFinal}
                    onChange={(e) => setValorFinal(e.target.value)}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="rotulo">Forma de pagamento</label>
                    <select className="campo" value={pagamento} onChange={(e) => setPagamento(e.target.value)}>
                      {FORMAS_PAGAMENTO.map((f) => (
                        <option key={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="rotulo">Garantia (dias)</label>
                    <input className="campo" type="number" min="0" value={garantia} onChange={(e) => setGarantia(e.target.value)} />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="rotulo">Observação (opcional)</label>
              <textarea
                className="campo"
                rows={2}
                placeholder={novoStatus === 'aguardando_peca' ? 'Ex: qual peça foi pedida e previsão' : ''}
                value={obsStatus}
                onChange={(e) => setObsStatus(e.target.value)}
              />
            </div>

            {erroStatus && <p className="erro">{erroStatus}</p>}

            <div className="flex justify-end gap-2">
              <button type="button" className="botao-cinza" onClick={() => setNovoStatus(null)}>
                Cancelar
              </button>
              <button className="botao" disabled={salvando}>
                {salvando ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
