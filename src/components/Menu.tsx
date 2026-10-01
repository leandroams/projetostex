import { NavLink } from 'react-router-dom'
import { emailParaUsuario, supabase } from '../supabase'

export default function Menu({ email }: { email: string }) {
  function classeLink({ isActive }: { isActive: boolean }) {
    if (isActive) return 'rounded bg-blue-900 px-3 py-1'
    return 'rounded px-3 py-1 hover:bg-blue-600'
  }

  return (
    <nav className="bg-blue-700 text-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 p-3">
        <span className="mr-4 text-xl font-bold">STEX</span>

        <NavLink to="/" end className={classeLink}>
          Painel
        </NavLink>
        <NavLink to="/os" className={classeLink}>
          Ordens
        </NavLink>
        <NavLink to="/clientes" className={classeLink}>
          Clientes
        </NavLink>

        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm">{emailParaUsuario(email)}</span>
          <button onClick={() => supabase.auth.signOut()} className="rounded bg-blue-900 px-3 py-1 hover:bg-blue-950">
            Sair
          </button>
        </div>
      </div>
    </nav>
  )
}
