export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    await requireAuth()
    const q = req.nextUrl.searchParams.get('q') || ''
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20')

    const clientes = await prisma.cliente.findMany({
      where: {
        ativo: true,
        OR: q ? [
          { razaoSocial: { contains: q } },
          { cnpj: { contains: q } },
          { fatCidade: { contains: q } },
        ] : undefined,
      },
      include: {
        _count: { select: { orcamentosUsicrom: true, orcamentosTimbro: true } },
      },
      orderBy: { razaoSocial: 'asc' },
      take: limit,
    })
    return NextResponse.json(clientes)
  } catch {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth()
    const body = await req.json()

    if (!body.razaoSocial) {
      return NextResponse.json({ error: 'Razão Social é obrigatória.' }, { status: 400 })
    }

    // Verificar CNPJ duplicado
    if (body.cnpj) {
      const cnpjLimpo = body.cnpj.replace(/\D/g, '')
      if (cnpjLimpo.length > 0) {
        const existe = await prisma.cliente.findFirst({
          where: { cnpj: { contains: cnpjLimpo } },
        })
        if (existe) {
          return NextResponse.json({ error: 'CNPJ já cadastrado.', id: existe.id }, { status: 409 })
        }
      }
    }

    const cliente = await prisma.cliente.create({
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
    return NextResponse.json(cliente, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao criar cliente.' }, { status: 500 })
  }
}
