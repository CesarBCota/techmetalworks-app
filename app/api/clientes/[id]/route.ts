import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies()
    await requireAuth(cookieStore)
    const c = await prisma.cliente.findUnique({
      where: { id: params.id },
      include: {
        _count: { select: { orcamentosUsicrom: true, orcamentosTimbro: true } },
      },
    })
    if (!c) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
    return NextResponse.json(c)
  } catch {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies()
    await requireAuth(cookieStore)
    const body = await req.json()

    const c = await prisma.cliente.update({
      where: { id: params.id },
      data: {
        razaoSocial: body.razaoSocial,
        cnpj: body.cnpj || null,
        inscEstadual: body.inscEstadual || null,
        solicitante: body.solicitante || null,
        cargo: body.cargo || null,
        telefone: body.telefone || null,
        email: body.email || null,
        fatLogradouro: body.fatLogradouro || null,
        fatBairro: body.fatBairro || null,
        fatCidade: body.fatCidade || null,
        fatUf: body.fatUf || null,
        fatCep: body.fatCep || null,
        cobLogradouro: body.cobLogradouro || null,
        cobBairro: body.cobBairro || null,
        cobCidade: body.cobCidade || null,
        cobUf: body.cobUf || null,
        cobCep: body.cobCep || null,
        entLogradouro: body.entLogradouro || null,
        entBairro: body.entBairro || null,
        entCidade: body.entCidade || null,
        entUf: body.entUf || null,
        entCep: body.entCep || null,
      },
    })
    return NextResponse.json(c)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies()
    await requireAuth(cookieStore)

    const count = await prisma.orcamentoUsicrom.count({ where: { clienteId: params.id } })
    const countT = await prisma.orcamentoTimbro.count({ where: { clienteId: params.id } })
    if (count + countT > 0) {
      return NextResponse.json({ error: 'Cliente possui orçamentos vinculados. Inative-o em vez de excluir.' }, { status: 409 })
    }

    await prisma.cliente.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao excluir' }, { status: 500 })
  }
}
