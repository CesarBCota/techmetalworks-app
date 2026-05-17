import { getIronSession, SessionOptions } from 'iron-session'
import { cookies } from 'next/headers'
import { db } from './db'
import bcrypt from 'bcryptjs'

export interface SessionData {
  usuarioId?: string
  nome?: string
  email?: string
  isLoggedIn: boolean
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: 'techmetalworks-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  },
}

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
