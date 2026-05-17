import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session.isLoggedIn) {
    return NextResponse.json({ isLoggedIn: false }, { status: 401 })
  }
  return NextResponse.json({
    isLoggedIn: true,
    usuarioId: session.usuarioId,
    nome: session.nome,
    email: session.email,
  })
}
