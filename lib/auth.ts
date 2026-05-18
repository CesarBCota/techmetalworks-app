import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { db } from './db'
import bcrypt from 'bcryptjs'
import { sessionOptions } from './session'
import type { SessionData } from './session'

export type { SessionData } from './session'
export { sessionOptions } from './session'

export async function getSession() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions)
  if (!session.isLoggedIn) {
    session.isLoggedIn = false
  }
  return session
}

export async function login(email: string, senha: string) {
  const usuario = await db.usuario.findUnique({
    where: { email: email.toLowerCase().trim() },
  })

  if (!usuario || !usuario.ativo) {
    return { ok: false, erro: 'Usuário não encontrado ou inativo' }
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senha)
  if (!senhaValida) {
    return { ok: false, erro: 'Senha incorreta' }
  }

  const session = await getSession()
  session.isLoggedIn = true
  session.usuarioId = usuario.id
  session.nome = usuario.nome
  session.email = usuario.email
  await session.save()

  return { ok: true, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email } }
}

export async function logout() {
  const session = await getSession()
  session.destroy()
}

export async function requireAuth() {
  const session = await getSession()
  if (!session.isLoggedIn || !session.usuarioId) {
    return null
  }
  return session
}
