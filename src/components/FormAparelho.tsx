import { useState } from 'react'
import { salvarAparelho } from '../api'
import { TIPOS_APARELHO } from '../empresa'
import type { Aparelho } from '../tipos'
import Modal from './Modal'

type Props = {
  clienteId: string
  aparelho?: Aparelho // se vier preenchido é edição
  fechar: () => void
  aoSalvar: (aparelho: Aparelho) => void
}

export default function FormAparelho({ clienteId, aparelho, fechar, aoSalvar }: Props) {
  const [tipo, setTipo] = useState(aparelho?.tipo ?? 'Celular')
  const [marca, setMarca] = useState(aparelho?.marca ?? '')
  const [modelo, setModelo] = useState(aparelho?.modelo ?? '')
  const [serie, setSerie] = useState(aparelho?.numero_serie ?? '')
  const [observacoes, setObservacoes] = useState(aparelho?.observacoes ?? '')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  async function salvar(e: React.FormEvent) {
    e.preventDefault()

    if (marca.trim() === '' || modelo.trim() === '') {
      setErro('Informe a marca e o modelo.')
      return
    }

    setSalvando(true)
    try {
      const salvo = await salvarAparelho(
        {
          cliente_id: clienteId,
          tipo: tipo,
          marca: marca.trim(),
          modelo: modelo.trim(),
          numero_serie: serie.trim() || null,
          observacoes: observacoes.trim() || null,
        },
        aparelho?.id,
      )
      aoSalvar(salvo)
    } catch (err: any) {
      setErro(err.message)
      setSalvando(false)
    }
  }

  return (
    <Modal titulo={aparelho ? 'Editar aparelho' : 'Novo aparelho'} fechar={fechar}>
      <form onSubmit={salvar} className="space-y-3">
        <div>
          <label className="rotulo">Tipo *</label>
          <select className="campo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            {TIPOS_APARELHO.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="rotulo">Marca *</label>
            <input className="campo" placeholder="Ex: Samsung" value={marca} onChange={(e) => setMarca(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="rotulo">Modelo *</label>
            <input className="campo" placeholder="Ex: Galaxy A54" value={modelo} onChange={(e) => setModelo(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="rotulo">Nº de série / IMEI</label>
          <input className="campo" value={serie} onChange={(e) => setSerie(e.target.value)} />
        </div>

        <div>
          <label className="rotulo">Observações (cor, riscos, etc)</label>
          <textarea className="campo" rows={2} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
        </div>

        {erro && <p className="erro">{erro}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="botao-cinza" onClick={fechar}>
            Cancelar
          </button>
          <button className="botao" disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
