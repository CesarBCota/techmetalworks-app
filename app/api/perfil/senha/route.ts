import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { senhaAtual, novaSenha } = await req.json()

    if (!senhaAtual || !novaSenha) {
      return NextResponse.json({ error: 'Preencha todos os campos' }, { status: 400 })
    }

    if (novaSenha.length < 6) {
      return NextResponse.json({ error: 'A nova senha deve ter pelo menos 6 caracteres' }, { status: 400 })
    }

    const usuario = await db.usuario.findUnique({
      where: { id: session.usuarioId },
    })

    if (!usuario) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const senhaValida = await bcrypt.compare(senhaAtual, usuario.senha)
    if (!senhaValida) {
      return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 400 })
    }

    const novaHash = await bcrypt.hash(novaSenha, 12)

    await db.usuario.update({
      where: { id: session.usuarioId },
      data: { senha: novaHash },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao alterar senha' }, { status: 500 })
  }
}
