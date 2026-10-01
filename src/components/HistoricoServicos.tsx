import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarEntreguesDoMes, type ServicoEntregue } from '../api'
import { data, moeda, numOS } from '../utils'

// mês atual no formato do <input type="month">: "2026-10"
function mesAtual() {
  const hoje = new Date()
  return hoje.getFullYear() + '-' + String(hoje.getMonth() + 1).padStart(2, '0')
}

// Histórico dos serviços entregues no mês, com os valores.
// Aparece na tela de Usuários, embaixo do cadastro.
export default function HistoricoServicos() {
  const [mes, setMes] = useState(mesAtual())
  const [servicos, setServicos] = useState<ServicoEntregue[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (mes === '') return
    setCarregando(true)
    listarEntreguesDoMes(mes)
      .then((lista) => {
        setServicos(lista)
        setErro('')
      })
      .catch((err) => setErro(err.message))
      .finally(() => setCarregando(false))
  }, [mes])

  // soma o total do mês e o total de cada forma de pagamento
  let total = 0
  const porPagamento: Record<string, number> = {}
  for (const s of servicos) {
    const valor = s.valor_final ?? 0
    const forma = s.forma_pagamento ?? 'Não informado'
    total += valor
    porPagamento[forma] = (porPagamento[forma] ?? 0) + valor
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Histórico</h2>
          <p className="text-gray-600">Serviços entregues no mês e os valores</p>
        </div>
        <div>
          <label className="rotulo" htmlFor="mes">
            Mês
          </label>
          <input id="mes" type="month" className="campo" value={mes} onChange={(e) => setMes(e.target.value)} />
        </div>
      </div>

      {erro && <p className="erro mb-4">{erro}</p>}

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="cartao border-t-4 border-t-green-500">
          <p className="text-sm text-gray-600">Total do mês</p>
          <p className="text-2xl font-bold text-green-700">{moeda(total)}</p>
        </div>
        <div className="cartao border-t-4 border-t-blue-500">
          <p className="text-sm text-gray-600">Serviços entregues</p>
          <p className="text-2xl font-bold text-blue-700">{servicos.length}</p>
        </div>
        {Object.keys(porPagamento).map((forma) => (
          <div key={forma} className="cartao">
            <p className="text-sm text-gray-600">{forma}</p>
            <p className="text-xl font-bold">{moeda(porPagamento[forma])}</p>
          </div>
        ))}
      </div>

      <div className="cartao-lista overflow-x-auto">
        {carregando ? (
          <p className="p-4">Carregando...</p>
        ) : servicos.length === 0 ? (
          <p className="p-4 text-gray-500">Nenhum serviço entregue neste mês.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-gray-600">
              <tr>
                <th className="p-3">Data</th>
                <th className="p-3">OS</th>
                <th className="p-3">Cliente</th>
                <th className="p-3">Aparelho</th>
                <th className="p-3">Serviço</th>
                <th className="p-3">Pagamento</th>
                <th className="p-3 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {servicos.map((s) => (
                <tr key={s.id} className="border-t border-gray-200">
                  <td className="p-3 whitespace-nowrap">{data(s.entregue_em)}</td>
                  <td className="p-3">
                    <Link to={'/os/' + s.id} className="text-blue-700 hover:underline">
                      {numOS(s.numero)}
                    </Link>
                  </td>
                  <td className="p-3">{s.aparelho.cliente.nome}</td>
                  <td className="p-3">
                    {s.aparelho.marca} {s.aparelho.modelo}
                  </td>
                  <td className="p-3">{s.servico_realizado ?? '-'}</td>
                  <td className="p-3 whitespace-nowrap">{s.forma_pagamento ?? '-'}</td>
                  <td className="p-3 text-right font-medium whitespace-nowrap">{moeda(s.valor_final)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300 font-bold">
                <td className="p-3" colSpan={6}>
                  Total
                </td>
                <td className="p-3 text-right whitespace-nowrap">{moeda(total)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  )
}
