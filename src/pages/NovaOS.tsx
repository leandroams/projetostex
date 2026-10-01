import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { abrirOS, buscarCliente, listarAparelhos, listarClientes } from '../api'
import FormAparelho from '../components/FormAparelho'
import FormCliente from '../components/FormCliente'
import type { Aparelho, Cliente } from '../tipos'
import { telefone, textoParaValor } from '../utils'

export default function NovaOS() {
  const navigate = useNavigate()
  const [params] = useSearchParams()

  // passo 1: cliente
  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState<Cliente[]>([])
  const [buscou, setBuscou] = useState(false)
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [formCliente, setFormCliente] = useState(false)

  // passo 2: aparelho
  const [aparelhos, setAparelhos] = useState<Aparelho[]>([])
  const [aparelhoId, setAparelhoId] = useState('')
  const [formAparelho, setFormAparelho] = useState(false)

  // passo 3: dados do atendimento
  const [defeito, setDefeito] = useState('')
  const [acessorios, setAcessorios] = useState('')
  const [orcamento, setOrcamento] = useState('')
  const [observacoes, setObservacoes] = useState('')

  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  // quando vem da tela do cliente já chega com ?cliente=...&aparelho=...
  useEffect(() => {
    const clienteId = params.get('cliente')
    if (clienteId) {
      buscarCliente(clienteId)
        .then((c) => selecionarCliente(c, params.get('aparelho') ?? ''))
        .catch((err) => setErro(err.message))
    }
  }, [])

  async function procurarCliente(e: React.FormEvent) {
    e.preventDefault()
    try {
      setResultados(await listarClientes(busca))
      setBuscou(true)
    } catch (err: any) {
      setErro(err.message)
    }
  }

  async function selecionarCliente(c: Cliente, aparelhoInicial = '') {
    setCliente(c)
    setErro('')
    try {
      const lista = await listarAparelhos(c.id)
      setAparelhos(lista)
      if (aparelhoInicial) setAparelhoId(aparelhoInicial)
      else if (lista.length === 1) setAparelhoId(lista[0].id) // só tem um, já deixa marcado
      else setAparelhoId('')
    } catch (err: any) {
      setErro(err.message)
    }
  }

  function trocarCliente() {
    setCliente(null)
    setAparelhos([])
    setAparelhoId('')
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()

    if (!cliente) {
      setErro('Escolha o cliente.')
      return
    }
    if (aparelhoId === '') {
      setErro('Escolha o aparelho.')
      return
    }
    if (defeito.trim() === '') {
      setErro('Descreva o defeito relatado pelo cliente.')
      return
    }

    setSalvando(true)
    try {
      const id = await abrirOS({
        aparelho_id: aparelhoId,
        defeito_relatado: defeito.trim(),
        acessorios: acessorios.trim() || null,
        observacoes: observacoes.trim() || null,
        valor_orcamento: textoParaValor(orcamento),
      })
      navigate('/os/' + id)
    } catch (err: any) {
      setErro(err.message)
      setSalvando(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/os" className="text-blue-700 hover:underline">
        &larr; Voltar
      </Link>
      <h1 className="titulo my-4">Nova Ordem de Serviço</h1>

      {/* ---------- 1. cliente ---------- */}
      <div className="cartao mb-4">
        <h2 className="mb-3 text-lg font-bold">1. Cliente</h2>

        {cliente ? (
          <div className="flex items-center justify-between gap-2 rounded bg-gray-100 p-3">
            <div>
              <b>{cliente.nome}</b>
              <div className="text-sm text-gray-600">{telefone(cliente.telefone)}</div>
            </div>
            <button className="botao-cinza" onClick={trocarCliente}>
              Trocar
            </button>
          </div>
        ) : (
          <div>
            <form onSubmit={procurarCliente} className="flex gap-2">
              <input
                className="campo flex-1"
                placeholder="Nome ou telefone do cliente"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
              <button className="botao">Buscar</button>
            </form>

            {resultados.map((c) => (
              <button
                key={c.id}
                onClick={() => selecionarCliente(c)}
                className="mt-2 flex w-full justify-between gap-2 rounded border border-gray-200 p-2 text-left hover:bg-gray-50"
              >
                <span>{c.nome}</span>
                <span className="text-gray-600">{telefone(c.telefone)}</span>
              </button>
            ))}
            {buscou && resultados.length === 0 && <p className="mt-2 text-gray-500">Nenhum cliente encontrado.</p>}

            <button className="botao-cinza mt-3" onClick={() => setFormCliente(true)}>
              + Cadastrar novo cliente
            </button>
          </div>
        )}
      </div>

      {/* ---------- 2. aparelho ---------- */}
      <div className="cartao mb-4">
        <h2 className="mb-3 text-lg font-bold">2. Aparelho</h2>

        {!cliente && <p className="text-gray-500">Escolha o cliente primeiro.</p>}

        {cliente && (
          <div>
            {aparelhos.map((a) => (
              <label key={a.id} className="mb-2 flex cursor-pointer items-center gap-2 rounded border border-gray-200 p-2">
                <input type="radio" name="aparelho" checked={aparelhoId === a.id} onChange={() => setAparelhoId(a.id)} />
                {a.tipo} - {a.marca} {a.modelo}
              </label>
            ))}
            <button className="botao-cinza" onClick={() => setFormAparelho(true)}>
              + Novo aparelho
            </button>
          </div>
        )}
      </div>

      {/* ---------- 3. atendimento ---------- */}
      <form onSubmit={salvar} className="cartao space-y-3">
        <h2 className="text-lg font-bold">3. Atendimento</h2>

        <div>
          <label className="rotulo">Defeito relatado pelo cliente *</label>
          <textarea className="campo" rows={3} value={defeito} onChange={(e) => setDefeito(e.target.value)} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="rotulo">Acessórios deixados</label>
            <input
              className="campo"
              placeholder="Ex: carregador, capa"
              value={acessorios}
              onChange={(e) => setAcessorios(e.target.value)}
            />
          </div>
          <div>
            <label className="rotulo">Orçamento prévio (R$)</label>
            <input
              className="campo"
              inputMode="decimal"
              placeholder="0,00"
              value={orcamento}
              onChange={(e) => setOrcamento(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="rotulo">Observações</label>
          <textarea className="campo" rows={2} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
        </div>

        {erro && <p className="erro">{erro}</p>}

        <button className="botao w-full" disabled={salvando}>
          {salvando ? 'Salvando...' : 'Abrir Ordem de Serviço'}
        </button>
      </form>

      {formCliente && (
        <FormCliente
          fechar={() => setFormCliente(false)}
          aoSalvar={(novo) => {
            setFormCliente(false)
            selecionarCliente(novo)
          }}
        />
      )}

      {formAparelho && cliente && (
        <FormAparelho
          clienteId={cliente.id}
          fechar={() => setFormAparelho(false)}
          aoSalvar={(novo) => {
            setFormAparelho(false)
            setAparelhos([...aparelhos, novo])
            setAparelhoId(novo.id)
          }}
        />
      )}
    </div>
  )
}
