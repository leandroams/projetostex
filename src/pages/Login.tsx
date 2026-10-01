import { useState } from 'react'
import { supabase, usuarioParaEmail } from '../supabase'

export default function Login() {
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [entrando, setEntrando] = useState(false)

  async function entrar(e: React.FormEvent) {
    e.preventDefault()
    if (usuario.trim() === '' || senha === '') {
      setErro('Preencha o usuário e a senha.')
      return
    }

    setEntrando(true)
    setErro('')
    const { error } = await supabase.auth.signInWithPassword({
      email: usuarioParaEmail(usuario),
      password: senha,
    })
    if (error) {
      if (error.message === 'Invalid login credentials') setErro('Usuário ou senha incorretos.')
      else setErro('Não foi possível entrar: ' + error.message)
      setEntrando(false)
    }
    // se deu certo o App.tsx percebe o login e troca a tela sozinho
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={entrar} className="cartao w-full max-w-sm">
        <h1 className="text-center text-3xl font-bold text-blue-700">STEX</h1>
        <p className="mb-6 text-center text-gray-600">Assistência Técnica - Ordens de Serviço</p>

        <label className="rotulo" htmlFor="usuario">
          Usuário
        </label>
        <input
          id="usuario"
          className="campo mb-4"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          autoCapitalize="none"
          autoFocus
        />

        <label className="rotulo" htmlFor="senha">
          Senha
        </label>
        <input
          id="senha"
          type="password"
          className="campo mb-4"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />

        {erro && <p className="erro mb-3">{erro}</p>}

        <button className="botao w-full" disabled={entrando}>
          {entrando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
