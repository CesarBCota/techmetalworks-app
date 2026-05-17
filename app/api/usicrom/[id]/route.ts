export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies()
    const session = await getSession(cookieStore)
    if (!session?.isLoggedIn) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const orc = await prisma.orcamentoUsicrom.findUnique({
      where: { id: params.id },
      include: {
        cliente: true,
        representante: true,
        itens: { orderBy: { sequencia: 'asc' } },
        lancamentoCaixa: true,
      },
    })
    if (!orc) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
    return NextResponse.json(orc)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies()
    const session = await getSession(cookieStore)
    if (!session?.isLoggedIn) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const existing = await prisma.orcamentoUsicrom.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
    if (['aprovado', 'perdido', 'expirado'].includes(existing.status)) {
      return NextResponse.json({ error: 'Orçamento não pode ser editado no status atual' }, { status: 403 })
    }

    const body = await req.json()

    // Recalcula dataValidade se validadeDias for informado
    let dataValidade: Date | undefined
    if (body.validadeDias != null) {
      const base = new Date()
      base.setDate(base.getDate() + Number(body.validadeDias))
      dataValidade = base
    }

    const orc = await prisma.orcamentoUsicrom.update({
      where: { id: params.id },
      data: {
        ...(body.clienteId           && { clienteId: body.clienteId }),
        ...(body.representanteId !== undefined && { representanteId: body.representanteId || null }),
        ...(body.percRepresentante != null && { percRepresentante: Number(body.percRepresentante) }),
        ...(body.percTecnoLumen    != null && { percTecnoLumen:    Number(body.percTecnoLumen) }),
        ...(dataValidade            && { dataValidade }),
        prazoEntrega:       body.prazoEntrega       ?? existing.prazoEntrega,
        condicoesPagamento: body.condicoesPagamento ?? existing.condicoesPagamento,
        observacao:         body.observacao         ?? existing.observacao,
      },
    })
    return NextResponse.json(orc)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies()
    const session = await getSession(cookieStore)
    if (!session?.isLoggedIn) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const orc = await prisma.orcamentoUsicrom.findUnique({ where: { id: params.id } })
    if (!orc) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
    if (orc.status === 'aprovado') {
      return NextResponse.json({ error: 'Não é possível excluir orçamento aprovado.' }, { status: 409 })
    }

    await prisma.orcamentoUsicrom.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao excluir' }, { status: 500 })
  }
}
