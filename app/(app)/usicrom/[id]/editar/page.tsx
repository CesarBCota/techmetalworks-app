import { notFound, redirect } from 'next/navigation'
import { db as prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { EditarOrcamentoForm } from '@/components/usicrom/EditarOrcamentoForm'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface Props { params: { id: string } }

export default async function EditarUsicomPage({ params }: Props) {
  await requireAuth()

  const [orc, representantes] = await Promise.all([
    prisma.orcamentoUsicrom.findUnique({
      where: { id: params.id },
    }),
    prisma.representante.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' },
    }),
  ])

  if (!orc) notFound()

  // Apenas rascunho e enviado podem ser editados
  if (['aprovado', 'perdido', 'expirado'].includes(orc.status)) {
    redirect(`/usicrom/${orc.id}`)
  }

  // Validade em dias a partir de hoje (arredonda para cima, mínimo 1)
  const diasRestantes = Math.max(
    1,
    Math.ceil(
      (new Date(orc.dataValidade).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    ),
  )

  const initialData = {
    clienteId:          orc.clienteId,
    representanteId:    orc.representanteId ?? null,
    percRepresentante:  orc.percRepresentante,
    percTecnoLumen:     orc.percTecnoLumen,
    validadeDias:       diasRestantes,
    prazoEntrega:       orc.prazoEntrega       ?? '',
    condicoesPagamento: orc.condicoesPagamento ?? '',
    observacao:         orc.observacao         ?? '',
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Editar Orçamento Usicrom</h1>
          <p className="text-text-muted text-sm mt-1 mono">{orc.numero}</p>
        </div>
        <Link href={`/usicrom/${orc.id}`} className="btn-ghost text-sm">← Cancelar</Link>
      </div>

      <EditarOrcamentoForm
        orcamentoId={orc.id}
        numero={orc.numero}
        representantes={representantes}
        initialData={initialData}
      />
    </div>
  )
}
