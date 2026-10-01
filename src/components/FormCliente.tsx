import { useState } from 'react'
import { salvarCliente } from '../api'
import type { Cliente } from '../tipos'
import { cpfCnpj, soNumeros, telefone } from '../utils'
import Modal from './Modal'

type Props = {
  cliente?: Cliente // se vier preenchido é edição
  fechar: () => void
  aoSalvar: (cliente: Cliente) => void
}

export default function FormCliente({ cliente, fechar, aoSalvar }: Props) {
  const [nome, setNome] = useState(cliente?.nome ?? '')
  const [fone, setFone] = useState(telefone(cliente?.telefone ?? ''))
  const [documento, setDocumento] = useState(cpfCnpj(cliente?.cpf_cnpj ?? ''))
  const [email, setEmail] = useState(cliente?.email ?? '')
  const [endereco, setEndereco] = useState(cliente?.endereco ?? '')
  const [observacoes, setObservacoes] = useState(cliente?.observacoes ?? '')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  async function salvar(e: React.FormEvent) {
    e.preventDefault()

    if (nome.trim() === '') {
      setErro('Informe o nome do cliente.')
      return
    }
    if (soNumeros(fone).length < 10) {
      setErro('Informe o telefone com DDD.')
      return
    }

    setSalvando(true)
    try {
      const salvo = await salvarCliente(
        {
          nome: nome.trim(),
          telefone: soNumeros(fone),
          cpf_cnpj: soNumeros(documento) || null,
          email: email.trim() || null,
          endereco: endereco.trim() || null,
          observacoes: observacoes.trim() || null,
        },
        cliente?.id,
      )
      aoSalvar(salvo)
    } catch (err: any) {
      setErro(err.message)
      setSalvando(false)
    }
  }

  return (
    <Modal titulo={cliente ? 'Editar cliente' : 'Novo cliente'} fechar={fechar}>
      <form onSubmit={salvar} className="space-y-3">
        <div>
          <label className="rotulo">Nome *</label>
          <input className="campo" value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="rotulo">Telefone / WhatsApp *</label>
            <input
              className="campo"
              type="tel"
              placeholder="(41) 90000-0000"
              value={fone}
              onChange={(e) => setFone(telefone(e.target.value))}
            />
          </div>
          <div>
            <label className="rotulo">CPF / CNPJ</label>
            <input className="campo" value={documento} onChange={(e) => setDocumento(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="rotulo">E-mail</label>
          <input className="campo" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div>
          <label className="rotulo">Endereço</label>
          <input className="campo" value={endereco} onChange={(e) => setEndereco(e.target.value)} />
        </div>

        <div>
          <label className="rotulo">Observações</label>
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
