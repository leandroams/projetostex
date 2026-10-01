import { Link } from 'react-router-dom'
import type { OSLista } from '../tipos'
import { data, diasNaLoja, numOS } from '../utils'
import SeloStatus from './SeloStatus'

type Props = {
  ordens: OSLista[]
  mostrarDias?: boolean // no painel mostra "há X dias" no lugar da data
}

// lista de ordens de serviço, usada no painel, na tela de ordens e na do cliente
export default function ListaOS({ ordens, mostrarDias }: Props) {
  if (ordens.length === 0) {
    return <p className="p-4 text-gray-500">Nenhuma ordem de serviço encontrada.</p>
  }

  return (
    <div>
      {ordens.map((os) => (
        <Link key={os.id} to={'/os/' + os.id} className="block border-b border-gray-200 p-3 last:border-0 hover:bg-gray-50">
          <div className="flex flex-wrap items-center gap-2">
            <b>OS {numOS(os.numero)}</b>
            <SeloStatus status={os.status} />
            <span className="ml-auto text-sm text-gray-500">{mostrarDias ? diasNaLoja(os.aberta_em) : data(os.aberta_em)}</span>
          </div>
          <div>
            {os.cliente_nome} - {os.aparelho_descricao}
          </div>
          <div className="text-sm text-gray-600">{os.defeito_relatado}</div>
        </Link>
      ))}
    </div>
  )
}
