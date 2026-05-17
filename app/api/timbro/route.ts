import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth'
import { db as prisma } from '@/lib/db'
import { calcularTimbro, FONTES_TIMBRO } from '@/lib/calculos-timbro'

function gerarNumero(razaoSocial: string): string {
  const ano = new Date().getFullYear()
  const sigla = razaoSocial.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 3)
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `TB-${ano}-${sigla}-${rand}`
}

// ── GET /api/timbro ── lista de orçamentos
export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies()
    const session = await getSession(cookieStore)
    if (!session?.isLoggedIn) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const q = searchParams.get('q') || ''

    const orcs = await prisma.orcamentoTimbro.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(q ? { cliente: { razaoSocial: { contains: q, mode: 'insensitive' } } } : {}),
      },
      include: { cliente: { select: { id: true, razaoSocial: true, fatCidade: true, fatUf: true } } },
      orderBy: { criadoEm: 'desc' },
    })

    return NextResponse.json(orcs)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao listar orçamentos.' }, { status: 500 })
  }
}

// ── POST /api/timbro ── criar orçamento
export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies()
    const session = await getSession(cookieStore)
    if (!session?.isLoggedIn) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await req.json()
    const {
      clienteId,
      fonte,
      lmeUsdTon,
      premioUsdTon,
      acrescimoUsdTon = 0,
      cambioDolar,
      quantidadeTon,
      prazoEntrega,
      condicoesPagamento,
      observacao,
      validadeDias = 10,
    } = body

    if (!clienteId) return NextResponse.json({ error: 'Cliente obrigatório.' }, { status: 400 })
    if (!fonte || !FONTES_TIMBRO[fonte as keyof typeof FONTES_TIMBRO]) {
      return NextResponse.json({ error: 'Fonte inválida.' }, { status: 400 })
    }
    if (!lmeUsdTon || !cambioDolar || !quantidadeTon) {
      return NextResponse.json({ error: 'LME, câmbio e quantidade são obrigatórios.' }, { status: 400 })
    }

    const cliente = await prisma.cliente.findUnique({ where: { id: String(clienteId) } })
    if (!cliente) return NextResponse.json({ error: 'Cliente não encontrado.' }, { status: 404 })

    const config = FONTES_TIMBRO[fonte as keyof typeof FONTES_TIMBRO]
    const resultado = calcularTimbro({
      fonte: fonte as any,
      lmeUsdTon:       Number(lmeUsdTon),
      premioUsdTon:    Number(premioUsdTon),
      acrescimoUsdTon: Number(acrescimoUsdTon),
      cambioDolar:     Number(cambioDolar),
      quantidadeTon:   Number(quantidadeTon),
    })

    const dataValidade = new Date()
    dataValidade.setDate(dataValidade.getDate() + Number(validadeDias))
    const numero = gerarNumero(cliente.razaoSocial)

    const orc = await prisma.orcamentoTimbro.create({
      data: {
        numero,
        clienteId: String(clienteId),
        dataValidade,
        fonte,
        lmeUsdTon:       resultado.lmeUsdTon,
        premioUsdTon:    resultado.premioUsdTon,
        acrescimoUsdTon: resultado.acrescimoUsdTon,
        percImpostos:    resultado.percImpostos,
        percDespachante: resultado.percDespachante,
        cambioDolar:     resultado.cambioDolar,
        precoBaseUsdTon:  resultado.baseUsdTon,
        precoFinalUsdTon: resultado.precoFinalUsdTon,
        precoFinalBrlTon: resultado.precoFinalBrlTon,
        quantidadeTon:    resultado.quantidadeTon,
        valorAcrescimoBrl: resultado.valorAcrescimoBrl,
        valorTotalBrl:    resultado.valorTotalBrl,
        prazoEntrega:      prazoEntrega || null,
        condicoesPagamento: condicoesPagamento || null,
        observacao:        observacao || null,
        criadoPor:         session.nome || session.email || 'sistema',
      },
    })

    return NextResponse.json(orc, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao criar orçamento.' }, { status: 500 })
  }
}
