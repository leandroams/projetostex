import { createClient } from '@supabase/supabase-js'

// os dados ficam no arquivo .env
const url = import.meta.env.VITE_SUPABASE_URL
const chave = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(url, chave)

// O Supabase só aceita login por e-mail. Como a equipe é pequena, o login
// da tela é só o nome de usuário e aqui eu completo com um e-mail interno.
// Ex: usuario "juliano" -> juliano@stex.local
const DOMINIO = '@stex.local'

export function usuarioParaEmail(usuario: string) {
  usuario = usuario.trim().toLowerCase()
  if (usuario.includes('@')) return usuario
  return usuario + DOMINIO
}

export function emailParaUsuario(email: string | null | undefined) {
  if (!email) return ''
  return email.replace(DOMINIO, '')
}
