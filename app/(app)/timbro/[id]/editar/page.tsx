import { notFound, redirect } from 'next/navigation'
import { db as prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { FormNovoOrcamentoTimbro } from '@/components/timbro/FormNovoOrcamentoTimbro'
import type { FonteTimbro } from '@/lib/calculos-timbro'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface Props { params: { id: string } }

export default async function EditarTimbroPage({ params }: Props) {
  await requireAuth()

  const orc = await prisma.orcamentoTimbro.findUnique({
    where: { id: params.id },
  })
  if (!orc) notFound()

  // Só permite editar rascunho ou enviado
  if (orc.status === 'aprovado' || orc.status === 'perdido' || orc.status === 'expirado') {
    redirect(`/timbro/${orc.id}`)
  }

  const initialData = {
    clienteId:       orc.clienteId,
    fonte:           orc.fonte as FonteTimbro,
    lmeUsdTon:       orc.lmeUsdTon,
    premioUsdTon:    orc.premioUsdTon,
    acrescimoUsdTon: orc.acrescimoUsdTon,
    cambioDolar:     orc.cambioDolar,
    quantidadeTon:   orc.quantidadeTon,
    dataValidade:    orc.dataValidade.toISOString().split('T')[0],
    condicoesPagamento: orc.condicoesPagamento ?? '',
    prazoEntrega:       orc.prazoEntrega ?? '',
    observacao:         orc.observacao ?? '',
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Editar Orçamento Timbro</h1>
          <p className="text-text-muted text-sm mt-1 mono">{orc.numero}</p>
        </div>
        <Link href={`/timbro/${orc.id}`} className="btn-ghost text-sm">← Cancelar</Link>
      </div>
      <FormNovoOrcamentoTimbro orcamentoId={orc.id} initialData={initialData} />
    </div>
  )
}
