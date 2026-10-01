import type { Status } from '../tipos'
import { STATUS } from '../utils'

// etiqueta colorida com o nome do status
export default function SeloStatus({ status }: { status: Status }) {
  return (
    <span className={'rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ' + STATUS[status].cor}>
      {STATUS[status].nome}
    </span>
  )
}
