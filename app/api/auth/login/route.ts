export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { login } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { username, senha } = await request.json()

    if (!username || !senha) {
      return NextResponse.json({ ok: false, erro: 'Usuário e senha obrigatórios' }, { status: 400 })
    }

    const resultado = await login(username, senha)

    if (!resultado.ok) {
      return NextResponse.json({ ok: false, erro: resultado.erro }, { status: 401 })
    }

    return NextResponse.json({ ok: true, usuario: resultado.usuario })
  } catch (err) {
    console.error('[login]', err)
    return NextResponse.json({ ok: false, erro: 'Erro interno' }, { status: 500 })
  }
}
