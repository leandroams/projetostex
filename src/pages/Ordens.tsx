import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { listarOS } from '../api'
import ListaOS from '../components/ListaOS'
import type { OSLista } from '../tipos'
import { LISTA_STATUS, STATUS } from '../utils'

export default function Ordens() {
  // o painel manda o status pela url (?status=pronto)
  const [params] = useSearchParams()
  const [status, setStatus] = useState(params.get('status') ?? 'abertas')
  const [busca, setBusca] = useState('')
  const [ordens, setOrdens] = useState<OSLista[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  async function carregar() {
    setCarregando(true)
    setErro('')
    try {
      setOrdens(await listarOS(status, busca))
    } catch (err: any) {
      setErro(err.message)
    }
    setCarregando(false)
  }

  // recarrega sempre que troca o filtro de status
  useEffect(() => {
    carregar()
  }, [status])

  function buscar(e: React.FormEvent) {
    e.preventDefault()
    carregar()
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="titulo">Ordens de Serviço</h1>
        <Link to="/os/nova" className="botao">
          + Nova OS
        </Link>
      </div>

      <form onSubmit={buscar} className="mb-4 flex flex-wrap gap-2">
        <input
          className="campo flex-1"
          placeholder="Nº da OS, cliente, telefone ou aparelho"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <select className="campo sm:w-48" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="abertas">Em aberto</option>
          {LISTA_STATUS.map((s) => (
            <option key={s} value={s}>
              {STATUS[s].nome}
            </option>
          ))}
          <option value="todas">Todas</option>
        </select>
        <button className="botao">Buscar</button>
      </form>

      {erro && <p className="erro">{erro}</p>}

      <div className="cartao p-0">{carregando ? <p className="p-4">Carregando...</p> : <ListaOS ordens={ordens} />}</div>
    </div>
  )
}
