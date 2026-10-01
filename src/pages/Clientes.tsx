import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { listarClientes } from '../api'
import FormCliente from '../components/FormCliente'
import type { Cliente } from '../tipos'
import { telefone } from '../utils'

export default function Clientes() {
  const navigate = useNavigate()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)

  async function carregar() {
    setCarregando(true)
    setErro('')
    try {
      setClientes(await listarClientes(busca))
    } catch (err: any) {
      setErro(err.message)
    }
    setCarregando(false)
  }

  useEffect(() => {
    carregar()
  }, [])

  function buscar(e: React.FormEvent) {
    e.preventDefault()
    carregar()
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="titulo">Clientes</h1>
        <button className="botao" onClick={() => setMostrarForm(true)}>
          + Novo cliente
        </button>
      </div>

      <form onSubmit={buscar} className="mb-4 flex gap-2">
        <input
          className="campo flex-1"
          placeholder="Nome, telefone ou CPF"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <button className="botao">Buscar</button>
      </form>

      {erro && <p className="erro">{erro}</p>}

      <div className="cartao-lista">
        {carregando && <p className="p-4">Carregando...</p>}
        {!carregando && clientes.length === 0 && <p className="p-4 text-gray-500">Nenhum cliente encontrado.</p>}
        {!carregando &&
          clientes.map((c) => (
            <Link
              key={c.id}
              to={'/clientes/' + c.id}
              className="flex items-center gap-3 border-b border-gray-200 p-3 last:border-0 hover:bg-slate-50"
            >
              {/* bolinha com a primeira letra do nome */}
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-800">
                {c.nome.charAt(0).toUpperCase()}
              </span>
              <b className="flex-1">{c.nome}</b>
              <span className="text-gray-600">{telefone(c.telefone)}</span>
            </Link>
          ))}
      </div>

      {mostrarForm && (
        <FormCliente fechar={() => setMostrarForm(false)} aoSalvar={(novo) => navigate('/clientes/' + novo.id)} />
      )}
    </div>
  )
}
