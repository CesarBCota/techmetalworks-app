import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { cookies } from 'next/headers'

function gerarNumero(razaoSocial: string): string {
  const d = new Date()
  const yy = String(d.getFullYear()).slice(2)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const nome = razaoSocial
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join('')
    .slice(0, 8)
  return `${yy}${mm}${dd}-${nome}-USI`
}

export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies()
    const session = await getSession(cookieStore)
    if (!session?.isLoggedIn) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const status = req.nextUrl.searchParams.get('status')
    const q = req.nextUrl.searchParams.get('q') || ''

    const orcamentos = await prisma.orcamentoUsicrom.findMany({
      where: {
        AND: [
          status ? { status } : {},
          q ? {
            OR: [
              { numero: { contains: q } },
              { cliente: { razaoSocial: { contains: q } } },
            ],
          } : {},
        ],
      },
      include: { cliente: true, representante: true },
      orderBy: { criadoEm: 'desc' },
    })
    return NextResponse.json(orcamentos)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies()
    const session = await getSession(cookieStore)
    if (!session?.isLoggedIn) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await req.json()
    const {
      clienteId,
      representanteId,
      percRepresentante,
      percTecnoLumen,
      prazoEntrega,
      condicoesPagamento,
      transportadora,
      frete,
      observacao,
      validadeDias,
      itens = [],
    } = body

    const cliente = await prisma.cliente.findUnique({ where: { id: String(clienteId) } })
    if (!cliente) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })

    const numero = gerarNumero(cliente.razaoSocial)
    const dataValidade = new Date()
    dataValidade.setDate(dataValidade.getDate() + (validadeDias || 10))

    // Calcular totais
    let valorTotalUsicrom = 0
    let valorTotalFinal = 0
    for (const item of itens) {
      valorTotalUsicrom += item.precoTotalSemIpi || 0
      valorTotalFinal += item.precoTotalSemIpi || 0 // ajuste conforme regra de impostos
    }
    const percRep = percRepresentante || 3.0
    const percTecno = percTecnoLumen || 4.0
    const valorComissaoRep = valorTotalFinal * (percRep / 100)
    const valorComissaoTecno = valorTotalFinal * (percTecno / 100)

    const orc = await prisma.orcamentoUsicrom.create({
      data: {
        numero,
        clienteId: String(clienteId),
        representanteId: representanteId || null,
        percRepresentante: percRep,
        percTecnoLumen: percTecno,
        prazoEntrega: prazoEntrega || null,
        condicoesPagamento: condicoesPagamento || null,
        transportadora: transportadora || 'USICROM',
        frete: frete || 'CIF',
        observacao: observacao || null,
        dataValidade,
        valorTotalUsicrom,
        valorTotalFinal,
        valorComissaoRep,
        valorComissaoTecno,
        criadoPor: session.nome || session.email || 'sistema',
        itens: {
          create: itens.map((item: Record<string, unknown>, i: number) => ({
            sequencia: i + 1,
            tipoProduto: item.tipoProduto || item.tipo || '',
            descricao: item.descricao || '',
            modelo: item.modelo || null,
            parametrosJson: JSON.stringify(item.parametrosJson || {}),
            pesoPretoKg: item.pesoPretoKg || 0,
            pesoGalvKg: item.pesoGalvKg || 0,
            precoKgUsicrom: item.precoKgUsicrom || 0,
            quantidade: item.quantidade || 1,
            unidade: item.unidade || 'PC',
            precoUnitSemIpi: item.precoUnitSemIpi || 0,
            precoTotalSemIpi: item.precoTotalSemIpi || 0,
            aliquotaIcms: item.aliquotaIcms || 12.0,
            pisCofins: item.pisCofins || 9.25,
            valorSt: item.valorSt || 0,
            aliquotaIpi: item.aliquotaIpi || 0,
            valorIpi: item.valorIpi || 0,
          })),
        },
      },
      include: { cliente: true, representante: true, itens: true },
    })

    return NextResponse.json(orc, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao criar orçamento.' }, { status: 500 })
  }
}
