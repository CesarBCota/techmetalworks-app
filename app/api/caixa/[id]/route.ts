export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

interface Ctx { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    await requireAuth()

    const lancamento = await prisma.lancamentoCaixa.findUnique({
      where: { id: params.id },
      include: {
        orcamentoUsicrom: { select: { numero: true, cliente: { select: { razaoSocial: true } } } },
        orcamentoTimbro:  { select: { numero: true, cliente: { select: { razaoSocial: true } } } },
      },
    })

    if (!lancamento) {
      return NextResponse.json({ error: 'Lançamento não encontrado' }, { status: 404 })
    }

    return NextResponse.json(lancamento)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    await requireAuth()

    const existing = await prisma.lancamentoCaixa.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Lançamento não encontrado' }, { status: 404 })
    }
    if (existing.origem !== 'manual') {
      return NextResponse.json({ error: 'Apenas lançamentos manuais podem ser editados' }, { status: 403 })
    }

    const body = await req.json()
    const { data, descricao, tipo, categoria, valor, conta } = body

    if (tipo && !['receita', 'despesa'].includes(tipo)) {
      return NextResponse.json({ error: 'tipo deve ser receita ou despesa' }, { status: 400 })
    }
    if (valor != null && Number(valor) <= 0) {
      return NextResponse.json({ error: 'valor deve ser positivo' }, { status: 400 })
    }

    const atualizado = await prisma.lancamentoCaixa.update({
      where: { id: params.id },
      data: {
        ...(data      && { data:      new Date(data) }),
        ...(descricao && { descricao }),
        ...(tipo      && { tipo }),
        ...(categoria && { categoria }),
        ...(valor != null && { valor: Number(valor) }),
        ...(conta !== undefined && { conta: conta || null }),
      },
    })

    return NextResponse.json(atualizado)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    await requireAuth()

    const existing = await prisma.lancamentoCaixa.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Lançamento não encontrado' }, { status: 404 })
    }
    if (existing.origem !== 'manual') {
      return NextResponse.json(
        { error: 'Lançamentos automáticos (vinculados a orçamentos) não podem ser excluídos aqui' },
        { status: 403 },
      )
    }

    await prisma.lancamentoCaixa.delete({ where: { id: params.id } })
    return new NextResponse(null, { status: 204 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
