import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { cookies } from 'next/headers'
import { calcularTimbro, FONTES_TIMBRO, FonteTimbro } from '@/lib/calculos-timbro'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies()
    const session = await getSession(cookieStore)
    if (!session?.isLoggedIn) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const orc = await prisma.orcamentoTimbro.findUnique({
      where: { id: params.id },
      include: { cliente: true, lancamentoCaixa: true },
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

    const orc = await prisma.orcamentoTimbro.findUnique({ where: { id: params.id } })
    if (!orc) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
    if (orc.status === 'aprovado') {
      return NextResponse.json({ error: 'Orçamento aprovado não pode ser editado.' }, { status: 409 })
    }

    const body = await req.json()
    const {
      clienteId, dataValidade, fonte, lmeUsdTon, premioUsdTon,
      acrescimoUsdTon, cambioDolar, quantidadeTon,
      prazoEntrega, condicoesPagamento, observacao,
    } = body

    const resultado = calcularTimbro({
      fonte: fonte as FonteTimbro,
      lmeUsdTon: Number(lmeUsdTon),
      premioUsdTon: Number(premioUsdTon),
      acrescimoUsdTon: Number(acrescimoUsdTon ?? 0),
      cambioDolar: Number(cambioDolar),
      quantidadeTon: Number(quantidadeTon ?? 1),
    })

    const atualizado = await prisma.orcamentoTimbro.update({
      where: { id: params.id },
      data: {
        clienteId: String(clienteId),
        dataValidade: new Date(dataValidade),
        fonte,
        lmeUsdTon: resultado.lmeUsdTon,
        premioUsdTon: resultado.premioUsdTon,
        acrescimoUsdTon: resultado.acrescimoUsdTon,
        percImpostos: resultado.percImpostos,
        percDespachante: resultado.percDespachante,
        cambioDolar: resultado.cambioDolar,
        precoBaseUsdTon: resultado.baseUsdTon,
        precoFinalUsdTon: resultado.precoFinalUsdTon,
        precoFinalBrlTon: resultado.precoFinalBrlTon,
        quantidadeTon: resultado.quantidadeTon,
        valorAcrescimoBrl: resultado.valorAcrescimoBrl,
        valorTotalBrl: resultado.valorTotalBrl,
        prazoEntrega: prazoEntrega || null,
        condicoesPagamento: condicoesPagamento || null,
        observacao: observacao || null,
      },
      include: { cliente: true },
    })
    return NextResponse.json(atualizado)
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

    const orc = await prisma.orcamentoTimbro.findUnique({ where: { id: params.id } })
    if (!orc) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
    if (orc.status === 'aprovado') {
      return NextResponse.json({ error: 'Não é possível excluir orçamento aprovado.' }, { status: 409 })
    }

    await prisma.orcamentoTimbro.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao excluir' }, { status: 500 })
  }
}
