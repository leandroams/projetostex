import { Link, NavLink } from 'react-router-dom'
import { emailParaUsuario, supabase } from '../supabase'

export default function Menu({ email }: { email: string }) {
  function classeLink({ isActive }: { isActive: boolean }) {
    if (isActive) return 'rounded-md bg-white/20 px-3 py-1.5 font-medium'
    return 'rounded-md px-3 py-1.5 text-blue-100 hover:bg-white/10 hover:text-white'
  }

  return (
    <nav className="sticky top-0 z-10 bg-blue-800 text-white shadow">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-1 px-4 py-2">
        <Link to="/" className="mr-4 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-lg font-bold text-blue-800">S</span>
          <span className="text-xl font-bold">STEX</span>
        </Link>

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
          <span className="text-sm text-blue-100">{emailParaUsuario(email)}</span>
          <button onClick={() => supabase.auth.signOut()} className="rounded-md border border-white/40 px-3 py-1 text-sm hover:bg-white/10">
            Sair
          </button>
        </div>
      </div>
    </nav>
  )
}
