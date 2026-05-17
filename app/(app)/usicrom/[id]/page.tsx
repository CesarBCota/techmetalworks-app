import { notFound } from 'next/navigation'
import { db as prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { AlterarStatus } from '@/components/usicrom/AlterarStatus'

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
const fmtKg = (v: number) =>
  new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(v) + ' kg'
const fmtData = (d: Date) =>
  new Date(d).toLocaleDateString('pt-BR')

interface Props { params: { id: string } }

export default async function DetalheOrcamentoPage({ params }: Props) {
  const cookieStore = cookies()
  await requireAuth(cookieStore)

  const orc = await prisma.orcamentoUsicrom.findUnique({
    where: { id: params.id },
    include: {
      cliente: true,
      representante: true,
      itens: { orderBy: { sequencia: 'asc' } },
      lancamentoCaixa: true,
    },
  })
  if (!orc) notFound()

  const totalPesoPreto = orc.itens.reduce((s, i) => s + i.pesoPretoKg * i.quantidade, 0)
  const totalPesoGalv = orc.itens.reduce((s, i) => s + i.pesoGalvKg * i.quantidade, 0)

  const tipoLabel: Record<string, string> = {
    conico_continuo: 'Cônico Contínuo',
    teleconico: 'Telecônico',
    poligonal: 'Poligonal',
    braco: 'Braço',
    janela_inspecao: 'Janela Inspeção',
    chumbador: 'Chumbadores',
    pintura_m2: 'Pintura m²',
    flange: 'Flange',
    suporte_22: 'Suporte Ø22',
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* ── Cabeçalho ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-text mono">{orc.numero}</h1>
            <StatusBadge status={orc.status} />
          </div>
          <p className="text-text-muted mt-1">{orc.cliente.razaoSocial}</p>
          <p className="text-text-faint text-xs mt-0.5">
            Emitido em {fmtData(orc.dataEmissao)} · Válido até {fmtData(orc.dataValidade)}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/usicrom" className="btn-ghost text-sm">← Voltar</Link>
          {['rascunho', 'enviado'].includes(orc.status) && (
            <Link href={`/usicrom/${orc.id}/editar`} className="btn-secondary text-sm">
              ✏️ Editar
            </Link>
          )}
          <Link
            href={`/usicrom/${orc.id}/pdf`}
            target="_blank"
            className="btn-secondary text-sm"
          >
            🖨️ Imprimir PDF
          </Link>
          <AlterarStatus orcId={orc.id} statusAtual={orc.status} />
        </div>
      </div>

      {/* ── Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Financeiro */}
        <div className="card space-y-3">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Financeiro</h2>
          <div className="flex justify-between">
            <span className="text-text-muted text-sm">Valor Usicrom</span>
            <span className="text-text font-semibold">{fmt(orc.valorTotalUsicrom)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted text-sm">Valor Final (cliente)</span>
            <span className="text-text font-bold text-base">{fmt(orc.valorTotalFinal)}</span>
          </div>
          <hr className="border-bg-border" />
          <div className="flex justify-between text-xs">
            <span className="text-text-muted">Peso Preto Total</span>
            <span className="text-text">{fmtKg(totalPesoPreto)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-text-muted">Peso Galv. Total</span>
            <span className="text-text">{fmtKg(totalPesoGalv)}</span>
          </div>
        </div>

        {/* Comissões */}
        <div className="card space-y-3">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Comissões (7% total)</h2>
          <div className="flex justify-between">
            <span className="text-text-muted text-sm">
              {orc.representante?.nome || 'Representante'} ({orc.percRepresentante}%)
            </span>
            <span className="text-text font-semibold">{fmt(orc.valorComissaoRep)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted text-sm">Tech Metalworks ({orc.percTecnoLumen}%)</span>
            <span className="text-blue-glow font-bold">{fmt(orc.valorComissaoTecno)}</span>
          </div>
        </div>

        {/* Condições */}
        <div className="card space-y-3">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Condições</h2>
          {[
            { l: 'Pagamento', v: orc.condicoesPagamento },
            { l: 'Prazo de Entrega', v: orc.prazoEntrega },
            { l: 'Frete', v: orc.frete },
            { l: 'Transportadora', v: orc.transportadora },
          ].map(({ l, v }) => (
            <div key={l} className="flex justify-between gap-2">
              <span className="text-text-muted text-sm">{l}</span>
              <span className="text-text text-sm text-right">{v || '—'}</span>
            </div>
          ))}
          {orc.observacao && (
            <div className="pt-2 border-t border-bg-border">
              <p className="text-text-muted text-xs mb-1">Observações</p>
              <p className="text-text text-sm">{orc.observacao}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Itens ── */}
      <div>
        <h2 className="text-lg font-semibold text-text mb-3">Itens do Orçamento</h2>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-bg-border">
                  {['#', 'Tipo / Descrição', 'Qtd', 'Peso Preto', 'Peso Galv.', 'Preço Unit.', 'Total'].map(h => (
                    <th key={h} className={`text-text-muted text-xs font-semibold uppercase tracking-wider px-4 py-3 ${h !== '#' && h !== 'Tipo / Descrição' && h !== 'Qtd' ? 'text-right hidden md:table-cell' : ''} ${h === 'Qtd' ? 'text-right' : ''}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orc.itens.map((item) => (
                  <tr key={item.id} className="table-row">
                    <td className="px-4 py-3 text-text-faint font-bold">{item.sequencia}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-text">{item.descricao || tipoLabel[item.tipoProduto] || item.tipoProduto}</div>
                      <div className="text-text-muted text-xs mt-0.5">ICMS {item.aliquotaIcms}% · PIS/COFINS {item.pisCofins}%{item.aliquotaIpi > 0 ? ` · IPI ${item.aliquotaIpi}%` : ''}</div>
                    </td>
                    <td className="px-4 py-3 text-right text-text">{item.quantidade}</td>
                    <td className="px-4 py-3 text-right text-text-muted hidden md:table-cell">{fmtKg(item.pesoPretoKg * item.quantidade)}</td>
                    <td className="px-4 py-3 text-right text-text-muted hidden md:table-cell">{fmtKg(item.pesoGalvKg * item.quantidade)}</td>
                    <td className="px-4 py-3 text-right text-text hidden md:table-cell">{fmt(item.precoUnitSemIpi)}</td>
                    <td className="px-4 py-3 text-right text-text font-bold hidden md:table-cell">{fmt(item.precoTotalSemIpi)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-bg-border bg-bg-hover">
                  <td colSpan={6} className="px-4 py-3 text-right text-text-muted font-semibold text-sm hidden md:table-cell">TOTAL</td>
                  <td className="px-4 py-3 text-right text-text font-bold hidden md:table-cell">{fmt(orc.valorTotalFinal)}</td>
                  <td colSpan={2} className="px-4 py-3 text-right text-text font-bold md:hidden">Total: {fmt(orc.valorTotalFinal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* ── Lançamento no Caixa ── */}
      {orc.lancamentoCaixa && (
        <div>
          <h2 className="text-lg font-semibold text-text mb-3">Lançamento no Caixa</h2>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text font-semibold">{orc.lancamentoCaixa.descricao}</p>
                <p className="text-text-muted text-sm mt-1">
                  {new Date(orc.lancamentoCaixa.data).toLocaleDateString('pt-BR')} · {orc.lancamentoCaixa.categoria} · origem {orc.lancamentoCaixa.origem}
                </p>
              </div>
              <div className="text-green-400 font-bold text-lg">{fmt(orc.lancamentoCaixa.valor)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
