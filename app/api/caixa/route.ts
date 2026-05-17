export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies()
    await requireAuth(cookieStore)

    const { searchParams } = new URL(req.url)
    const mes    = searchParams.get('mes')    // 'YYYY-MM'
    const tipo   = searchParams.get('tipo')   // 'receita' | 'despesa'
    const categ  = searchParams.get('categ')  // 'usicrom' | 'timbro' | 'manual'
    const origem = searchParams.get('origem') // 'manual' | 'automatico'

    // Build date filter
    const where: Record<string, unknown> = {}

    if (mes) {
      const [ano, month] = mes.split('-').map(Number)
      const inicio = new Date(ano, month - 1, 1)
      const fim    = new Date(ano, month, 1)
      where.data   = { gte: inicio, lt: fim }
    }
    if (tipo)   where.tipo      = tipo
    if (categ)  where.categoria = categ
    if (origem) where.origem    = origem

    const lancamentos = await prisma.lancamentoCaixa.findMany({
      where,
      orderBy: { data: 'desc' },
      include: {
        orcamentoUsicrom: { select: { numero: true, cliente: { select: { razaoSocial: true } } } },
        orcamentoTimbro:  { select: { numero: true, cliente: { select: { razaoSocial: true } } } },
      },
    })

    // Summary totals (same filter, ignoring month if querying all)
    const totais = await prisma.lancamentoCaixa.aggregate({
      where,
      _sum: { valor: true },
      _count: true,
    })

    const receitas = await prisma.lancamentoCaixa.aggregate({
      where: { ...where, tipo: 'receita' },
      _sum: { valor: true },
    })

    const despesas = await prisma.lancamentoCaixa.aggregate({
      where: { ...where, tipo: 'despesa' },
      _sum: { valor: true },
    })

    return NextResponse.json({
      lancamentos,
      resumo: {
        totalReceitas:  receitas._sum.valor ?? 0,
        totalDespesas:  despesas._sum.valor ?? 0,
        saldo:         (receitas._sum.valor ?? 0) - (despesas._sum.valor ?? 0),
        count:          totais._count,
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies()
    const session = await requireAuth(cookieStore)

    const body = await req.json()
    const { data, descricao, tipo, categoria, valor, conta } = body

    if (!data || !descricao || !tipo || !categoria || valor == null) {
      return NextResponse.json({ error: 'Campos obrigatórios: data, descricao, tipo, categoria, valor' }, { status: 400 })
    }
    if (!['receita', 'despesa'].includes(tipo)) {
      return NextResponse.json({ error: 'tipo deve ser receita ou despesa' }, { status: 400 })
    }
    if (Number(valor) <= 0) {
      return NextResponse.json({ error: 'valor deve ser positivo' }, { status: 400 })
    }

    const lancamento = await prisma.lancamentoCaixa.create({
      data: {
        data:      new Date(data),
        descricao,
        tipo,
        categoria,
        valor:     Number(valor),
        conta:     conta || null,
        origem:    'manual',
        criadoPor: (session as { email?: string }).email ?? 'sistema',
      },
    })

    return NextResponse.json(lancamento, { status: 201 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
