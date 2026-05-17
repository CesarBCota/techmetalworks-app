import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { cookies } from 'next/headers'

const TRANSICOES: Record<string, string[]> = {
  rascunho: ['enviado'],
  enviado: ['aprovado', 'perdido', 'rascunho'],
  aprovado: ['perdido'],
  perdido: [],
  expirado: [],
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies()
    const session = await getSession(cookieStore)
    if (!session?.isLoggedIn) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { novoStatus } = await req.json()
    const orc = await prisma.orcamentoUsicrom.findUnique({
      where: { id: params.id },
      include: { cliente: true, representante: true },
    })
    if (!orc) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

    const permitidos = TRANSICOES[orc.status] || []
    if (!permitidos.includes(novoStatus)) {
      return NextResponse.json(
        { error: `Transição inválida: ${orc.status} → ${novoStatus}` },
        { status: 400 }
      )
    }

    const atualizado = await prisma.orcamentoUsicrom.update({
      where: { id: params.id },
      data: { status: novoStatus },
    })

    // Ao aprovar: criar lançamentos no caixa automaticamente
    if (novoStatus === 'aprovado') {
      // Verificar se já existe lançamento
      const jaExiste = await prisma.lancamentoCaixa.findUnique({
        where: { orcamentoUsicomId: params.id },
      })

      if (!jaExiste) {
        await prisma.lancamentoCaixa.create({
          data: {
            data: new Date(),
            descricao: `Receita — Usicrom ${orc.numero} (${orc.cliente.razaoSocial})`,
            tipo: 'receita',
            categoria: 'usicrom',
            valor: orc.valorComissaoTecno,
            conta: 'Tech Metalworks',
            orcamentoUsicomId: params.id,
            origem: 'automatico',
            criadoPor: session.nome || session.email || 'sistema',
          },
        })
      }
    }

    return NextResponse.json(atualizado)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao alterar status' }, { status: 500 })
  }
}
