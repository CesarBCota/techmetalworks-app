import { db } from '@/lib/db'
import { formatBRL, formatData, STATUS_CONFIG } from '@/lib/utils'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getDashboardData() {
  const now = new Date()
  const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1)
  const fimMes    = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const [
    totalUsicrom,
    totalTimbro,
    usicromEnviados,
    usicromAprovados,
    timbroEnviados,
    timbroAprovados,
    lancamentosRecentes,
    ultimosUsicrom,
    ultimosTimbro,
    receitasMes,
    despesasMes,
    receitasTotal,
    despesasTotal,
  ] = await Promise.all([
    db.orcamentoUsicrom.count(),
    db.orcamentoTimbro.count(),
    db.orcamentoUsicrom.count({ where: { status: 'enviado' } }),
    db.orcamentoUsicrom.count({ where: { status: 'aprovado' } }),
    db.orcamentoTimbro.count({ where: { status: 'enviado' } }),
    db.orcamentoTimbro.count({ where: { status: 'aprovado' } }),
    db.lancamentoCaixa.findMany({
      orderBy: { data: 'desc' },
      take: 6,
      include: {
        orcamentoUsicrom: { select: { numero: true } },
        orcamentoTimbro:  { select: { numero: true } },
      },
    }),
    db.orcamentoUsicrom.findMany({
      orderBy: { criadoEm: 'desc' },
      take: 5,
      include: { cliente: { select: { razaoSocial: true } } },
    }),
    db.orcamentoTimbro.findMany({
      orderBy: { criadoEm: 'desc' },
      take: 5,
      include: { cliente: { select: { razaoSocial: true } } },
    }),
    db.lancamentoCaixa.aggregate({
      where: { tipo: 'receita', data: { gte: inicioMes, lt: fimMes } },
      _sum: { valor: true },
    }),
    db.lancamentoCaixa.aggregate({
      where: { tipo: 'despesa', data: { gte: inicioMes, lt: fimMes } },
      _sum: { valor: true },
    }),
    db.lancamentoCaixa.aggregate({ where: { tipo: 'receita' }, _sum: { valor: true } }),
    db.lancamentoCaixa.aggregate({ where: { tipo: 'despesa' }, _sum: { valor: true } }),
  ])

  const saldoTotal = (receitasTotal._sum.valor ?? 0) - (despesasTotal._sum.valor ?? 0)
  const saldoMes   = (receitasMes._sum.valor  ?? 0) - (despesasMes._sum.valor  ?? 0)

  return {
    totalUsicrom, totalTimbro,
    usicromEnviados, usicromAprovados,
    timbroEnviados,  timbroAprovados,
    saldoTotal, saldoMes,
    receitasMes: receitasMes._sum.valor ?? 0,
    despesasMes: despesasMes._sum.valor ?? 0,
    lancamentosRecentes,
    ultimosUsicrom,
    ultimosTimbro,
  }
}

export default async function DashboardPage() {
  const d = await getDashboardData()

  const mesNome = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-text">Dashboard</h1>
        <p className="text-text-muted text-sm mt-1 capitalize">Visão geral — {mesNome}</p>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

        <div className="card space-y-1">
          <p className="text-xs text-text-faint uppercase tracking-wider">Saldo Total</p>
          <p className={`text-2xl font-bold mono ${d.saldoTotal >= 0 ? 'text-blue-glow' : 'text-red-400'}`}>
            {formatBRL(d.saldoTotal)}
          </p>
          <p className="text-xs text-text-faint">Acumulado histórico</p>
        </div>

        <div className="card space-y-1">
          <p className="text-xs text-text-faint uppercase tracking-wider">Orç. Enviados</p>
          <p className="text-2xl font-bold text-blue-light mono">
            {d.usicromEnviados + d.timbroEnviados}
          </p>
          <p className="text-xs text-text-faint">
            {d.usicromEnviados} Usicrom · {d.timbroEnviados} Timbro
          </p>
        </div>

        <div className="card space-y-1">
          <p className="text-xs text-text-faint uppercase tracking-wider">Aprovados</p>
          <p className="text-2xl font-bold text-green-400 mono">
            {d.usicromAprovados + d.timbroAprovados}
          </p>
          <p className="text-xs text-text-faint">
            {d.usicromAprovados} Usicrom · {d.timbroAprovados} Timbro
          </p>
        </div>
      </div>

      {/* ── Recent quotes ── */}
      <div className="grid md:grid-cols-2 gap-4">

        {/* Usicrom */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text">Últimos — Usicrom</h2>
            <Link href="/usicrom" className="text-xs text-blue-glow hover:underline">
              Ver todos ({d.totalUsicrom}) →
            </Link>
          </div>
          {d.ultimosUsicrom.length === 0 ? (
            <div className="text-center py-6 text-text-faint text-sm">
              Nenhum orçamento.{' '}
              <Link href="/usicrom/novo" className="text-blue-glow hover:underline">Criar primeiro</Link>
            </div>
          ) : (
            <div className="space-y-1">
              {d.ultimosUsicrom.map(orc => {
                const cfg = STATUS_CONFIG[orc.status as keyof typeof STATUS_CONFIG]
                return (
                  <Link
                    key={orc.id}
                    href={`/usicrom/${orc.id}`}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-bg-hover transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text truncate">{orc.cliente.razaoSocial}</p>
                      <p className="text-xs text-text-muted mono">{orc.numero}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-3">
                      <span className={`badge ${cfg.color}`}>{cfg.label}</span>
                      <span className="text-xs text-text-faint">{formatData(orc.criadoEm)}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Timbro */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text">Últimos — Timbro</h2>
            <Link href="/timbro" className="text-xs text-blue-glow hover:underline">
              Ver todos ({d.totalTimbro}) →
            </Link>
          </div>
          {d.ultimosTimbro.length === 0 ? (
            <div className="text-center py-6 text-text-faint text-sm">
              Nenhum orçamento.{' '}
              <Link href="/timbro/novo" className="text-blue-glow hover:underline">Criar primeiro</Link>
            </div>
          ) : (
            <div className="space-y-1">
              {d.ultimosTimbro.map(orc => {
                const cfg = STATUS_CONFIG[orc.status as keyof typeof STATUS_CONFIG]
                return (
                  <Link
                    key={orc.id}
                    href={`/timbro/${orc.id}`}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-bg-hover transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text truncate">{orc.cliente.razaoSocial}</p>
                      <p className="text-xs text-text-muted mono">{orc.numero}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-3">
                      <span className={`badge ${cfg.color}`}>{cfg.label}</span>
                      <span className="text-xs text-text-faint">{formatData(orc.criadoEm)}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Recent cash entries ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-text">Últimos Lançamentos no Caixa</h2>
          <Link href="/caixa" className="text-xs text-blue-glow hover:underline">Ver todos →</Link>
        </div>
        {d.lancamentosRecentes.length === 0 ? (
          <div className="text-center py-6 text-text-faint text-sm">
            Nenhum lançamento.{' '}
            <Link href="/caixa" className="text-blue-glow hover:underline">Ir para Fluxo de Caixa</Link>
          </div>
        ) : (
          <div className="divide-y divide-bg-border">
            {d.lancamentosRecentes.map(l => (
              <div key={l.id} className="flex items-center justify-between py-2.5 gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-text truncate">{l.descricao}</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {formatData(l.data)} · {l.categoria}
                    {l.orcamentoUsicrom && ` · ${l.orcamentoUsicrom.numero}`}
                    {l.orcamentoTimbro  && ` · ${l.orcamentoTimbro.numero}`}
                  </p>
                </div>
                <p className={`text-sm font-bold mono flex-shrink-0 ${
                  l.tipo === 'receita' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {l.tipo === 'receita' ? '+' : '−'}{formatBRL(l.valor)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Quick actions ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: '/usicrom/novo', label: '+ Orçamento Usicrom', cls: 'border-blue-mid/50 hover:border-blue-main hover:bg-blue-deep/20' },
          { href: '/timbro/novo',  label: '+ Orçamento Timbro',  cls: 'border-silver-dim/30 hover:border-silver-mid hover:bg-bg-hover' },
          { href: '/caixa',        label: '+ Lançamento Caixa',  cls: 'border-green-700/30 hover:border-green-600 hover:bg-green-900/10' },
          { href: '/clientes/novo',label: '+ Novo Cliente',      cls: 'border-bg-border hover:border-text-muted hover:bg-bg-hover' },
        ].map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`card text-center text-sm font-medium text-text-muted hover:text-text transition-all duration-200 border ${item.cls} py-3`}
          >
            {item.label}
          </Link>
        ))}
      </div>

    </div>
  )
}
