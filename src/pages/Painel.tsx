import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarOS } from '../api'
import ListaOS from '../components/ListaOS'
import type { OSLista } from '../tipos'

export default function Painel() {
  const [ordens, setOrdens] = useState<OSLista[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    // busca só as que ainda não foram entregues
    listarOS('abertas')
      .then((lista) => setOrdens(lista))
      .catch((err) => setErro(err.message))
      .finally(() => setCarregando(false))
  }, [])

  const emAnalise = ordens.filter((os) => os.status === 'em_analise')
  const aguardando = ordens.filter((os) => os.status === 'aguardando_peca')
  const prontas = ordens.filter((os) => os.status === 'pronto')

  // na bancada: as mais antigas primeiro
  const naBancada = [...emAnalise, ...aguardando].sort((a, b) => a.numero - b.numero)

  const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  if (carregando) return <p>Carregando...</p>
  if (erro) return <p className="erro">{erro}</p>

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="titulo">Painel</h1>
          <p className="text-gray-600">
            {hoje} - {ordens.length} {ordens.length === 1 ? 'aparelho na loja' : 'aparelhos na loja'}
          </p>
        </div>
        <Link to="/os/nova" className="botao">
          + Nova OS
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <Link to="/os?status=em_analise" className="cartao border-t-4 border-blue-500 text-center hover:shadow-md">
          <p className="text-4xl font-bold text-blue-600">{emAnalise.length}</p>
          <p className="text-sm text-gray-600">Em Análise</p>
        </Link>
        <Link to="/os?status=aguardando_peca" className="cartao border-t-4 border-yellow-500 text-center hover:shadow-md">
          <p className="text-4xl font-bold text-yellow-600">{aguardando.length}</p>
          <p className="text-sm text-gray-600">Aguardando Peça</p>
        </Link>
        <Link to="/os?status=pronto" className="cartao border-t-4 border-green-500 text-center hover:shadow-md">
          <p className="text-4xl font-bold text-green-600">{prontas.length}</p>
          <p className="text-sm text-gray-600">Prontos</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <h2 className="mb-2 text-lg font-bold">Na bancada</h2>
          <div className="cartao p-0">
            {naBancada.length === 0 ? (
              <p className="p-4 text-gray-500">Nenhum aparelho na bancada.</p>
            ) : (
              <ListaOS ordens={naBancada} mostrarDias />
            )}
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-bold">Prontos para retirada</h2>
          <div className="cartao p-0">
            {prontas.length === 0 ? (
              <p className="p-4 text-gray-500">Nenhum aparelho esperando o cliente.</p>
            ) : (
              <ListaOS ordens={prontas} mostrarDias />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
