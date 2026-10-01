import { useEffect, useState } from 'react'
import { criarUsuario, excluirUsuario, listarUsuarios, trocarSenhaUsuario, type Usuario } from '../api'
import Modal from '../components/Modal'
import { dataHora } from '../utils'

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  // formulário de novo usuário
  const [nome, setNome] = useState('')
  const [senha, setSenha] = useState('')
  const [senha2, setSenha2] = useState('')
  const [erroForm, setErroForm] = useState('')
  const [salvando, setSalvando] = useState(false)

  // janela de trocar senha
  const [trocando, setTrocando] = useState<Usuario | null>(null)
  const [novaSenha, setNovaSenha] = useState('')
  const [erroSenha, setErroSenha] = useState('')

  async function carregar() {
    try {
      setUsuarios(await listarUsuarios())
      setErro('')
    } catch (err: any) {
      setErro(err.message)
    }
    setCarregando(false)
  }

  useEffect(() => {
    carregar()
  }, [])

  async function cadastrar(e: React.FormEvent) {
    e.preventDefault()
    setMensagem('')

    if (nome.trim().length < 3) {
      setErroForm('O usuário precisa ter pelo menos 3 letras.')
      return
    }
    if (senha.length < 6) {
      setErroForm('A senha precisa ter pelo menos 6 caracteres.')
      return
    }
    if (senha !== senha2) {
      setErroForm('As senhas não são iguais.')
      return
    }

    setSalvando(true)
    try {
      await criarUsuario(nome, senha)
      setMensagem('Usuário ' + nome.trim().toLowerCase() + ' cadastrado.')
      setNome('')
      setSenha('')
      setSenha2('')
      setErroForm('')
      await carregar()
    } catch (err: any) {
      setErroForm(err.message)
    }
    setSalvando(false)
  }

  function abrirTrocaSenha(u: Usuario) {
    setTrocando(u)
    setNovaSenha('')
    setErroSenha('')
  }

  async function salvarSenha(e: React.FormEvent) {
    e.preventDefault()
    if (!trocando) return
    if (novaSenha.length < 6) {
      setErroSenha('A senha precisa ter pelo menos 6 caracteres.')
      return
    }
    try {
      await trocarSenhaUsuario(trocando.id, novaSenha)
      setMensagem('Senha de ' + trocando.usuario + ' alterada.')
      setTrocando(null)
    } catch (err: any) {
      setErroSenha(err.message)
    }
  }

  async function apagar(u: Usuario) {
    if (!confirm('Excluir o usuário ' + u.usuario + '? Ele não vai mais conseguir entrar no sistema.')) return
    try {
      await excluirUsuario(u.id)
      setMensagem('Usuário ' + u.usuario + ' excluído.')
      carregar()
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <div>
      <h1 className="titulo mb-4">Usuários</h1>

      {mensagem && <p className="mb-4 rounded bg-green-100 p-3 text-green-800">{mensagem}</p>}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <form onSubmit={cadastrar} className="cartao space-y-3 md:self-start">
          <h2 className="subtitulo">Novo usuário</h2>

          <div>
            <label className="rotulo">Usuário *</label>
            <input
              className="campo"
              placeholder="Ex: adewerton"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              autoCapitalize="none"
              autoComplete="off"
            />
            <p className="mt-1 text-sm text-gray-500">Sem espaço e sem acento.</p>
          </div>
          <div>
            <label className="rotulo">Senha *</label>
            <input
              className="campo"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="rotulo">Repetir a senha *</label>
            <input
              className="campo"
              type="password"
              value={senha2}
              onChange={(e) => setSenha2(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          {erroForm && <p className="erro">{erroForm}</p>}

          <button className="botao" disabled={salvando}>
            {salvando ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>

        <div>
          <h2 className="subtitulo">Usuários cadastrados</h2>
          {erro && <p className="erro mb-2">{erro}</p>}
          <div className="cartao-lista">
            {carregando && <p className="p-4">Carregando...</p>}
            {usuarios.map((u) => (
              <div key={u.id} className="flex flex-wrap items-center gap-3 border-b border-gray-200 p-3 last:border-0">
                <div className="flex-1">
                  <b>{u.usuario}</b>
                  <div className="text-sm text-gray-500">
                    {u.ultimo_acesso ? 'Último acesso: ' + dataHora(u.ultimo_acesso) : 'Nunca entrou'}
                  </div>
                </div>
                <button className="text-blue-700 hover:underline" onClick={() => abrirTrocaSenha(u)}>
                  Trocar senha
                </button>
                <button className="text-red-600 hover:underline" onClick={() => apagar(u)}>
                  Excluir
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {trocando && (
        <Modal titulo={'Trocar senha de ' + trocando.usuario} fechar={() => setTrocando(null)}>
          <form onSubmit={salvarSenha} className="space-y-3">
            <div>
              <label className="rotulo">Nova senha *</label>
              <input
                className="campo"
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                autoComplete="new-password"
                autoFocus
              />
            </div>
            {erroSenha && <p className="erro">{erroSenha}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" className="botao-cinza" onClick={() => setTrocando(null)}>
                Cancelar
              </button>
              <button className="botao">Salvar</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
