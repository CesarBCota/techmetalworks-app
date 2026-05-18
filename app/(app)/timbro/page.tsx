'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { StatusBadge } from '@/components/ui/StatusBadge'

export const dynamic = 'force-dynamic'

interface OrcamentoTimbro {
  id: string
  numero: string
  status: string
  dataEmissao: string
  dataValidade: string
  fonte: string
  lmeUsdTon: number
  precoFinalUsdTon: number
  precoFinalBrlTon: number
  quantidadeTon: number
  valorTotalBrl: number
  valorAcrescimoBrl: number
  cliente: { id: string; razaoSocial: string }
}

const FONTES_LABEL: Record<string, string> = {
  lingote_al: 'Lingote A.L.',
  nexa: 'NEXA',
  cvt_europa: 'CVT Europa',
  cvt_mexico_es: 'CVT México/ES',
}

const fmtBrl = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
const fmtUsd = (v: number) =>
  v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function OrcamentosTimbroPage() {
  const [orcamentos, setOrcamentos] = useState<OrcamentoTimbro[]>([])
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [loading, setLoading] = useState(true)

  const carregar = useCallback(async (q: string, status: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (status) params.set('status', status)
      const res = await fetch(`/api/timbro?${params}`)
      const data = await res.json()
      setOrcamentos(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => carregar(busca, filtroStatus), 300)
    return () => clearTimeout(t)
  }, [busca, filtroStatus, carregar])

  const total = orcamentos.length
  const enviados = orcamentos.filter(o => o.status === 'enviado').length
  const aprovados = orcamentos.filter(o => o.status === 'aprovado').length
  const perdidos = orcamentos.filter(o => o.status === 'perdido').length
  const acrescimoTotal = orcamentos
    .filter(o => o.status === 'aprovado')
    .reduce((s, o) => s + o.valorAcrescimoBrl, 0)

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Orçamentos Timbro</h1>
          <p className="text-text-muted text-sm mt-1">
            {total} orçamento{total !== 1 ? 's' : ''} — representação zinco
          </p>
        </div>
        <Link href="/timbro/novo" className="btn-primary">+ Novo Orçamento</Link>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Enviados', val: enviados, cor: 'text-blue-glow' },
          { label: 'Aprovados', val: aprovados, cor: 'text-green-400' },
          { label: 'Perdidos', val: perdidos, cor: 'text-red-400' },
          { label: 'Acréscimo Aprovado', val: fmtBrl(acrescimoTotal), cor: 'text-silver-bright', small: true },
        ].map(c => (
          <div key={c.label} className="card text-center py-4">
            <div className={`font-bold ${c.cor} ${c.small ? 'text-base' : 'text-xl'}`}>{c.val}</div>
            <div className="text-text-muted text-xs mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="card mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Buscar por número ou cliente..."
            className="input flex-1"
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
          <select className="input sm:w-44" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
            <option value="">Todos os status</option>
            <option value="rascunho">Rascunho</option>
            <option value="enviado">Enviado</option>
            <option value="aprovado">Aprovado</option>
            <option value="perdido">Perdido</option>
          </select>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-center text-text-muted py-16">Carregando...</div>
      ) : orcamentos.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-text-muted text-lg mb-4">Nenhum orçamento encontrado</p>
          <Link href="/timbro/novo" className="btn-primary">Criar primeiro orçamento</Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-text-muted text-xs font-semibold uppercase tracking-wider px-4 py-3">Número</th>
                  <th className="text-left text-text-muted text-xs font-semibold uppercase tracking-wider px-4 py-3">Cliente</th>
                  <th className="text-left text-text-muted text-xs font-semibold uppercase tracking-wider px-4 py-3 hidden md:table-cell">Fonte</th>
                  <th className="text-left text-text-muted text-xs font-semibold uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Status</th>
                  <th className="text-right text-text-muted text-xs font-semibold uppercase tracking-wider px-4 py-3 hidden lg:table-cell">USD/ton</th>
                  <th className="text-right text-text-muted text-xs font-semibold uppercase tracking-wider px-4 py-3 hidden md:table-cell">Total R$</th>
                  <th className="text-right text-text-muted text-xs font-semibold uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Acréscimo</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {orcamentos.map(o => (
                  <tr key={o.id} className="table-row">
                    <td className="px-4 py-3 font-mono text-text text-sm font-semibold">{o.numero}</td>
                    <td className="px-4 py-3 text-text text-sm">{o.cliente.razaoSocial}</td>
                    <td className="px-4 py-3 text-text-muted text-sm hidden md:table-cell">
                      {FONTES_LABEL[o.fonte] ?? o.fonte}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-text text-sm hidden lg:table-cell">
                      USD {fmtUsd(o.precoFinalUsdTon)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-text text-sm hidden md:table-cell">
                      {fmtBrl(o.valorTotalBrl)}
                    </td>
                    <td className="px-4 py-3 text-right text-text-muted text-sm hidden lg:table-cell">
                      {fmtBrl(o.valorAcrescimoBrl)}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/timbro/${o.id}`} className="text-blue-glow hover:text-blue-light text-sm font-medium">
                        Ver →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
