export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  const auth = await requireAuth()
  if (!auth) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 })

  const reps = await db.representante.findMany({
    where: { ativo: true },
    orderBy: { nome: 'asc' },
  })
  return NextResponse.json(reps)
}
