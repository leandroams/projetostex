import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { supabase } from './supabase'
import Menu from './components/Menu'
import Login from './pages/Login'
import Painel from './pages/Painel'
import Ordens from './pages/Ordens'
import NovaOS from './pages/NovaOS'
import OSDetalhe from './pages/OSDetalhe'
import Clientes from './pages/Clientes'
import ClienteDetalhe from './pages/ClienteDetalhe'

export default function App() {
  const [email, setEmail] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    // verifica se já tem alguém logado
    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user.email ?? null)
      setCarregando(false)
    })

    // atualiza quando faz login ou logout
    const { data } = supabase.auth.onAuthStateChange((_evento, sessao) => {
      setEmail(sessao?.user.email ?? null)
    })

    return () => data.subscription.unsubscribe()
  }, [])

  if (carregando) return <p className="p-6">Carregando...</p>

  if (!email) return <Login />

  return (
    <div>
      <Menu email={email} />
      <main className="mx-auto max-w-5xl p-4">
        <Routes>
          <Route path="/" element={<Painel />} />
          <Route path="/os" element={<Ordens />} />
          <Route path="/os/nova" element={<NovaOS />} />
          <Route path="/os/:id" element={<OSDetalhe />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/clientes/:id" element={<ClienteDetalhe />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  )
}
