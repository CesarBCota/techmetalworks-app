'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { StatusBadge } from '@/components/ui/StatusBadge'

interface OrcamentoUsicrom {
  id: string
  numero: string
  status: string
  dataEmissao: string
  dataValidade: string
  valorTotalUsicrom: number
  valorTotalFinal: number
  valorComissaoTecno: number
  cliente: { id: string; razaoSocial: string }
  representante: { nome: string } | null
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export default function OrcamentosUsicomPage() {
  const [orcamentos, setOrcamentos] = useState<OrcamentoUsicrom[]>([])
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [loading, setLoading] = useState(true)

  const carregar = useCallback(async (q: string, status: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (status) params.set('status', status)
      const res = await fetch(`/api/usicrom?${params}`)
      const data = await res.json()
      setOrcamentos(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => carregar(busca, filtroStatus), 300)
    return () => clearTimeout(t)
  }, [busca, filtroStatus, carregar])

  // Resumo
  const total = orcamentos.length
  const enviados = orcamentos.filter(o => o.status === 'enviado').length
  const aprovados = orcamentos.filter(o => o.status === 'aprovado').length
  const perdidos = orcamentos.filter(o => o.status === 'perdido').length
  const comissaoTotal = orcamentos
    .filter(o => o.status === 'aprovado')
    .reduce((s, o) => s + o.valorComissaoTecno, 0)

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Orçamentos Usicrom</h1>
          <p className="text-text-muted text-sm mt-1">{total} orçamento{total !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/usicrom/novo" className="btn-primary">+ Novo Orçamento</Link>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Enviados', val: enviados, cor: 'text-blue-glow' },
          { label: 'Aprovados', val: aprovados, cor: 'text-green-400' },
          { label: 'Perdidos', val: perdidos, cor: 'text-red-400' },
          { label: 'Comissão Aprovada', val: fmt(comissaoTotal), cor: 'text-silver-bright', small: true },
        ].map(c => (
          <div key={c.label} className="card text-center py-4">
            <div className={`text-xl font-bold ${c.cor} ${c.small ? 'text-lg' : ''}`}>{c.val}</div>
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
          <Link href="/usicrom/novo" className="btn-primary">Criar primeiro orçamento</Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-bg-border">
                  <th className="text-left text-text-muted text-xs font-semibold uppercase tracking-wider px-4 py-3">Número</th>
                  <th className="text-left text-text-muted text-xs font-semibold uppercase tracking-wider px-4 py-3">Cliente</th>
                  <th className="text-left text-text-muted text-xs font-semibold uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Status</th>
                  <th className="text-right text-text-muted text-xs font-semibold uppercase tracking-wider px-4 py-3 hidden md:table-cell">Valor Final</th>
                  <th className="text-right text-text-muted text-xs font-semibold uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Comissão TL</th>
                  <th className="text-left text-text-muted text-xs font-semibold uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Representante</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {orcamentos.map(o => (
                  <tr key={o.id} className="table-row">
                    <td className="px-4 py-3 mono text-text text-sm font-semibold">{o.numero}</td>
                    <td className="px-4 py-3">
                      <div className="text-text text-sm">{o.cliente.razaoSocial}</div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-3 text-right text-text font-semibold text-sm hidden md:table-cell">
                      {fmt(o.valorTotalFinal)}
                    </td>
                    <td className="px-4 py-3 text-right text-text-muted text-sm hidden lg:table-cell">
                      {fmt(o.valorComissaoTecno)}
                    </td>
                    <td className="px-4 py-3 text-text-muted text-sm hidden lg:table-cell">
                      {o.representante?.nome || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/usicrom/${o.id}`} className="text-blue-glow hover:text-blue-light text-sm font-medium">
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
