import { notFound } from 'next/navigation'
import { db as prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import Link from 'next/link'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { AlterarStatusTimbro } from '@/components/timbro/AlterarStatusTimbro'
import { FONTES_TIMBRO } from '@/lib/calculos-timbro'

export const dynamic = 'force-dynamic'

const fmtBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
const fmtUSD = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD' }).format(v)
const fmtNum = (v: number, dec = 2) =>
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(v)
const fmtData = (d: Date) =>
  new Date(d).toLocaleDateString('pt-BR')

interface Props { params: { id: string } }

export default async function DetalheTimbroPage({ params }: Props) {
  await requireAuth()

  const orc = await prisma.orcamentoTimbro.findUnique({
    where: { id: params.id },
    include: {
      cliente: true,
      lancamentoCaixa: true,
    },
  })
  if (!orc) notFound()

  const fonteConfig = FONTES_TIMBRO[orc.fonte as keyof typeof FONTES_TIMBRO]
  const fonteLabel = fonteConfig?.label ?? orc.fonte

  // Reconstruct breakdown values
  const percTotalEncargos = orc.percImpostos + orc.percDespachante
  const fatorEncargos = 1 + percTotalEncargos / 100
  const baseUsdTon = orc.lmeUsdTon + orc.premioUsdTon + orc.acrescimoUsdTon

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">

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
          <Link href="/timbro" className="btn-ghost text-sm">← Voltar</Link>
          <Link
            href={`/timbro/${orc.id}/pdf`}
            target="_blank"
            className="btn-secondary text-sm"
          >
            🖨️ Imprimir PDF
          </Link>
          <AlterarStatusTimbro orcId={orc.id} statusAtual={orc.status} />
        </div>
      </div>

      {/* ── Cards superiores ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Fonte */}
        <div className="card space-y-3">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Fonte / Origem</h2>
          <div>
            <p className="text-text font-bold text-base">{fonteLabel}</p>
            <p className="text-text-faint text-xs mt-0.5">Impostos: {fmtNum(orc.percImpostos)}% · Despachante: {fmtNum(orc.percDespachante)}%</p>
          </div>
          <hr className="border-bg-border" />
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Quantidade</span>
            <span className="text-text font-semibold">{fmtNum(orc.quantidadeTon, 3)} ton</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Câmbio USD</span>
            <span className="text-text font-semibold">R$ {fmtNum(orc.cambioDolar, 4)}</span>
          </div>
        </div>

        {/* Precificação USD */}
        <div className="card space-y-3">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Precificação (USD/ton)</h2>
          {[
            { l: 'LME', v: fmtUSD(orc.lmeUsdTon), sub: true },
            { l: 'Prêmio', v: `+ ${fmtUSD(orc.premioUsdTon)}`, sub: true },
            { l: 'Acréscimo TL', v: `+ ${fmtUSD(orc.acrescimoUsdTon)}`, sub: true },
            { l: 'Base USD/ton', v: fmtUSD(baseUsdTon), sub: false },
            { l: `× Encargos (${fmtNum(percTotalEncargos)}%)`, v: `× ${fmtNum(fatorEncargos, 4)}`, sub: true },
            { l: 'Preço Final USD/ton', v: fmtUSD(orc.precoFinalUsdTon), sub: false },
          ].map(({ l, v, sub }) => (
            <div key={l} className={`flex justify-between text-sm ${sub ? '' : 'pt-1 border-t border-bg-border'}`}>
              <span className={sub ? 'text-text-faint' : 'text-text-muted font-semibold'}>{l}</span>
              <span className={sub ? 'text-text-muted' : 'text-text font-bold'}>{v}</span>
            </div>
          ))}
        </div>

        {/* Totais BRL */}
        <div className="card space-y-3">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Totais (R$)</h2>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Preço Final R$/ton</span>
            <span className="text-text font-semibold">{fmtBRL(orc.precoFinalBrlTon)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">× {fmtNum(orc.quantidadeTon, 3)} ton</span>
            <span className="text-text font-bold text-base">{fmtBRL(orc.valorTotalBrl)}</span>
          </div>
          <hr className="border-bg-border" />
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Acréscimo TL bruto</span>
            <span className="text-blue-glow font-bold">{fmtBRL(orc.valorAcrescimoBrl)}</span>
          </div>
          <p className="text-text-faint text-xs">
            = {fmtUSD(orc.acrescimoUsdTon)}/ton × {fmtNum(orc.quantidadeTon, 3)} ton × R$ {fmtNum(orc.cambioDolar, 4)}
          </p>
        </div>
      </div>

      {/* ── Condições ── */}
      {(orc.condicoesPagamento || orc.prazoEntrega || orc.observacao) && (
        <div className="card space-y-3">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Condições</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {orc.condicoesPagamento && (
              <div>
                <p className="text-text-faint text-xs mb-1">Pagamento</p>
                <p className="text-text text-sm">{orc.condicoesPagamento}</p>
              </div>
            )}
            {orc.prazoEntrega && (
              <div>
                <p className="text-text-faint text-xs mb-1">Prazo de Entrega</p>
                <p className="text-text text-sm">{orc.prazoEntrega}</p>
              </div>
            )}
            {orc.observacao && (
              <div className="sm:col-span-2">
                <p className="text-text-faint text-xs mb-1">Observações</p>
                <p className="text-text text-sm">{orc.observacao}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Lançamento no Caixa ── */}
      {orc.lancamentoCaixa && (
        <div>
          <h2 className="text-lg font-semibold text-text mb-3">Lançamento no Caixa</h2>
          <div className="card">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-text font-semibold">{orc.lancamentoCaixa.descricao}</p>
                <p className="text-text-muted text-sm mt-1">
                  {fmtData(orc.lancamentoCaixa.data)} · {orc.lancamentoCaixa.categoria} · {orc.lancamentoCaixa.tipo}
                </p>
              </div>
              <div className="text-green-400 font-bold text-lg whitespace-nowrap">
                {fmtBRL(orc.lancamentoCaixa.valor)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Editar ── */}
      {(orc.status === 'rascunho' || orc.status === 'enviado') && (
        <div className="flex justify-end">
          <Link
            href={`/timbro/${orc.id}/editar`}
            className="btn-secondary text-sm"
          >
            ✏️ Editar Orçamento
          </Link>
        </div>
      )}
    </div>
  )
}
