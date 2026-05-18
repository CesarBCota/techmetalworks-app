import { notFound } from 'next/navigation'
import { db as prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { FormCliente } from '@/components/clientes/FormCliente'
import Link from 'next/link'
import { formatData } from '@/lib/utils'

interface Props {
  params: { id: string }
}

export default async function EditarClientePage({ params }: Props) {
  await requireAuth()

  const cliente = await prisma.cliente.findUnique({
    where: { id: params.id },
    include: {
      _count: { select: { orcamentosUsicrom: true, orcamentosTimbro: true } },
      orcamentosUsicrom: {
        orderBy: { criadoEm: 'desc' },
        take: 5,
        select: { id: true, numero: true, status: true, valorTotalFinal: true, criadoEm: true },
      },
    },
  })

  if (!cliente) notFound()

  const totalOrc = cliente._count.orcamentosUsicrom + cliente._count.orcamentosTimbro

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">{cliente.razaoSocial}</h1>
          {cliente.nomeFantasia && (
            <p className="text-text-muted text-sm mt-0.5">{cliente.nomeFantasia}</p>
          )}
          <p className="text-text-faint text-xs mt-1 mono">{cliente.cnpj}</p>
        </div>
        <Link href="/clientes" className="btn-ghost text-sm">
          ← Voltar
        </Link>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="card text-center py-3">
          <div className="text-2xl font-bold text-text">{totalOrc}</div>
          <div className="text-text-muted text-xs mt-1">Orçamento{totalOrc !== 1 ? 's' : ''} total</div>
        </div>
        <div className="card text-center py-3">
          <div className="text-2xl font-bold text-text">{cliente._count.orcamentosUsicrom}</div>
          <div className="text-text-muted text-xs mt-1">Usicrom</div>
        </div>
      </div>

      {/* Formulário de edição */}
      <FormCliente cliente={{
        id: cliente.id,
        razaoSocial: cliente.razaoSocial,
        nomeFantasia: cliente.nomeFantasia,
        cnpj: cliente.cnpj,
        inscEstadual: cliente.inscEstadual,
        solicitante: cliente.solicitante,
        cargo: cliente.cargo,
        telefone: cliente.telefone,
        email: cliente.email,
        fatLogradouro: cliente.fatLogradouro,
        fatBairro: cliente.fatBairro,
        fatCidade: cliente.fatCidade,
        fatUf: cliente.fatUf,
        fatCep: cliente.fatCep,
        cobLogradouro: cliente.cobLogradouro,
        cobBairro: cliente.cobBairro,
        cobCidade: cliente.cobCidade,
        cobUf: cliente.cobUf,
        cobCep: cliente.cobCep,
        entLogradouro: cliente.entLogradouro,
        entBairro: cliente.entBairro,
        entCidade: cliente.entCidade,
        entUf: cliente.entUf,
        entCep: cliente.entCep,
      }} />

      {/* Últimos orçamentos */}
      {cliente.orcamentosUsicrom.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-text mb-3">Últimos Orçamentos Usicrom</h2>
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-bg-border">
                  <th className="text-left text-text-muted text-xs font-semibold uppercase px-4 py-3">Número</th>
                  <th className="text-left text-text-muted text-xs font-semibold uppercase px-4 py-3 hidden sm:table-cell">Data</th>
                  <th className="text-left text-text-muted text-xs font-semibold uppercase px-4 py-3">Status</th>
                  <th className="text-right text-text-muted text-xs font-semibold uppercase px-4 py-3">Valor</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {cliente.orcamentosUsicrom.map((o) => (
                  <tr key={o.id} className="table-row">
                    <td className="px-4 py-3 text-sm mono text-text">{o.numero}</td>
                    <td className="px-4 py-3 text-sm text-text-muted hidden sm:table-cell">{formatData(o.criadoEm.toISOString())}</td>
                    <td className="px-4 py-3">
                      <span className={`badge badge-${o.status}`}>{o.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-text">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(o.valorTotalFinal)}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/usicrom/${o.id}`} className="text-blue-glow hover:text-blue-light text-sm">
                        Ver →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {cliente._count.orcamentosUsicrom > 5 && (
              <div className="px-4 py-3 border-t border-bg-border text-center">
                <Link href={`/usicrom?cliente=${cliente.id}`} className="text-blue-glow text-sm hover:underline">
                  Ver todos {cliente._count.orcamentosUsicrom} orçamentos →
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
