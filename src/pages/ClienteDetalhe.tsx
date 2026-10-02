import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { buscarCliente, excluirAparelho, excluirCliente, listarAparelhos, listarOS } from '../api'
import FormAparelho from '../components/FormAparelho'
import FormCliente from '../components/FormCliente'
import ListaOS from '../components/ListaOS'
import type { Aparelho, Cliente, OSLista } from '../tipos'
import { cpfCnpj, telefone } from '../utils'

export default function ClienteDetalhe() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [aparelhos, setAparelhos] = useState<Aparelho[]>([])
  const [ordens, setOrdens] = useState<OSLista[]>([])
  const [erro, setErro] = useState('')

  const [editandoCliente, setEditandoCliente] = useState(false)
  const [formAparelho, setFormAparelho] = useState(false)
  const [aparelhoEditando, setAparelhoEditando] = useState<Aparelho | undefined>()

  async function carregar() {
    try {
      setCliente(await buscarCliente(id!))
      setAparelhos(await listarAparelhos(id!))
      setOrdens(await listarOS('todas', '', id))
    } catch (err: any) {
      setErro(err.message)
    }
  }

  useEffect(() => {
    carregar()
  }, [id])

  async function apagarCliente() {
    if (!confirm('Excluir este cliente e os aparelhos dele?')) return
    try {
      await excluirCliente(id!)
      navigate('/clientes')
    } catch (err: any) {
      alert(err.message)
    }
  }

  async function apagarAparelho(aparelho: Aparelho) {
    if (!confirm('Excluir o aparelho ' + aparelho.marca + ' ' + aparelho.modelo + '?')) return
    try {
      await excluirAparelho(aparelho.id)
      carregar()
    } catch (err: any) {
      alert(err.message)
    }
  }

  function abrirFormAparelho(aparelho?: Aparelho) {
    setAparelhoEditando(aparelho)
    setFormAparelho(true)
  }

  if (erro) return <p className="erro">{erro}</p>
  if (!cliente) return <p>Carregando...</p>

  return (
    <div>
      <Link to="/clientes" className="text-blue-700 hover:underline">
        Voltar
      </Link>

      <div className="my-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="titulo">{cliente.nome}</h1>
        <div className="flex gap-2">
          <Link to={'/os/nova?cliente=' + cliente.id} className="botao">
            + Nova OS
          </Link>
          <button className="botao-cinza" onClick={() => setEditandoCliente(true)}>
            Editar
          </button>
          <button className="botao-cinza text-red-600" onClick={apagarCliente}>
            Excluir
          </button>
        </div>
      </div>

      <div className="cartao mb-6">
        <p>
          <b>Telefone:</b> {telefone(cliente.telefone)}
        </p>
        {cliente.cpf_cnpj && (
          <p>
            <b>CPF/CNPJ:</b> {cpfCnpj(cliente.cpf_cnpj)}
          </p>
        )}
        {cliente.email && (
          <p>
            <b>E-mail:</b> {cliente.email}
          </p>
        )}
        {cliente.endereco && (
          <p>
            <b>Endereço:</b> {cliente.endereco}
          </p>
        )}
        {cliente.observacoes && (
          <p>
            <b>Observações:</b> {cliente.observacoes}
          </p>
        )}
      </div>

      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-bold">Aparelhos</h2>
        <button className="botao-cinza" onClick={() => abrirFormAparelho()}>
          + Aparelho
        </button>
      </div>
      <div className="cartao-lista mb-6">
        {aparelhos.length === 0 && <p className="p-4 text-gray-500">Nenhum aparelho cadastrado.</p>}
        {aparelhos.map((a) => (
          <div key={a.id} className="flex flex-wrap items-center gap-2 border-b border-gray-200 p-3 last:border-0">
            <div className="flex-1">
              <b>
                {a.marca} {a.modelo}
              </b>{' '}
              <span className="text-gray-600">({a.tipo})</span>
              {a.numero_serie && <div className="text-sm text-gray-600">Série/IMEI: {a.numero_serie}</div>}
            </div>
            <Link to={'/os/nova?cliente=' + cliente.id + '&aparelho=' + a.id} className="text-blue-700 hover:underline">
              Abrir OS
            </Link>
            <button className="text-blue-700 hover:underline" onClick={() => abrirFormAparelho(a)}>
              Editar
            </button>
            <button className="text-red-600 hover:underline" onClick={() => apagarAparelho(a)}>
              Excluir
            </button>
          </div>
        ))}
      </div>

      <h2 className="subtitulo">Ordens de serviço do cliente</h2>
      <div className="cartao-lista">
        <ListaOS ordens={ordens} />
      </div>

      {editandoCliente && (
        <FormCliente
          cliente={cliente}
          fechar={() => setEditandoCliente(false)}
          aoSalvar={(salvo) => {
            setCliente(salvo)
            setEditandoCliente(false)
          }}
        />
      )}

      {formAparelho && (
        <FormAparelho
          clienteId={cliente.id}
          aparelho={aparelhoEditando}
          fechar={() => setFormAparelho(false)}
          aoSalvar={() => {
            setFormAparelho(false)
            carregar()
          }}
        />
      )}
    </div>
  )
}
