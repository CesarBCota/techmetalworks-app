'use client'

import { useEffect, useState, useCallback } from 'react'

// ── Types ────────────────────────────────────────────────────────────────────

interface Lancamento {
  id: string
  data: string
  descricao: string
  tipo: 'receita' | 'despesa'
  categoria: string
  valor: number
  conta: string | null
  origem: string
  criadoPor: string
  orcamentoUsicrom?: { numero: string; cliente: { razaoSocial: string } } | null
  orcamentoTimbro?:  { numero: string; cliente: { razaoSocial: string } } | null
}

interface Resumo {
  totalReceitas: number
  totalDespesas: number
  saldo:         number
  count:         number
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmtBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const fmtData = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'UTC' })

function mesAtual() {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${d.getFullYear()}-${mm}`
}

function mesLabel(ym: string) {
  if (!ym) return 'Todos os meses'
  const [y, m] = ym.split('-')
  const date = new Date(Number(y), Number(m) - 1)
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

// ── Blank form state ──────────────────────────────────────────────────────────

const BLANK_FORM = {
  data:      new Date().toISOString().split('T')[0],
  descricao: '',
  tipo:      'receita' as 'receita' | 'despesa',
  categoria: 'manual',
  valor:     '',
  conta:     '',
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CaixaPage() {
  const [mes,      setMes]      = useState(mesAtual())
  const [categ,    setCateg]    = useState('')
  const [origem,   setOrigem]   = useState('')
  const [data,     setData]     = useState<Lancamento[]>([])
  const [resumo,   setResumo]   = useState<Resumo | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form,     setForm]     = useState(BLANK_FORM)
  const [saving,   setSaving]   = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error,    setError]    = useState('')
  const [formErr,  setFormErr]  = useState('')

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    const params = new URLSearchParams()
    if (mes)    params.set('mes',    mes)
    if (categ)  params.set('categ',  categ)
    if (origem) params.set('origem', origem)

    try {
      const res = await fetch(`/api/caixa?${params}`)
      if (!res.ok) throw new Error('Falha ao carregar lançamentos')
      const json = await res.json()
      setData(json.lancamentos)
      setResumo(json.resumo)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [mes, categ, origem])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Create ─────────────────────────────────────────────────────────────────

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setFormErr('')

    if (!form.data || !form.descricao || !form.tipo || !form.categoria || !form.valor) {
      setFormErr('Preencha todos os campos obrigatórios.')
      return
    }
    if (Number(form.valor) <= 0) {
      setFormErr('O valor deve ser maior que zero.')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/caixa', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          data:      form.data,
          descricao: form.descricao,
          tipo:      form.tipo,
          categoria: form.categoria,
          valor:     Number(form.valor),
          conta:     form.conta || null,
        }),
      })
      if (!res.ok) {
        const j = await res.json()
        setFormErr(j.error ?? 'Erro ao salvar')
        return
      }
      setShowForm(false)
      setForm(BLANK_FORM)
      fetchData()
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  async function handleDelete(id: string) {
    if (!confirm('Excluir este lançamento? Esta ação não pode ser desfeita.')) return
    setDeleting(id)
    try {
      await fetch(`/api/caixa/${id}`, { method: 'DELETE' })
      fetchData()
    } finally {
      setDeleting(null)
    }
  }

  // ── Meses select (12 months back) ─────────────────────────────────────────

  const meses = (() => {
    const list: { value: string; label: string }[] = [{ value: '', label: 'Todos os meses' }]
    const now = new Date()
    for (let i = 0; i < 13; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const ym = `${d.getFullYear()}-${mm}`
      list.push({ value: ym, label: mesLabel(ym) })
    }
    return list
  })()

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Fluxo de Caixa</h1>
          <p className="text-text-muted text-sm mt-0.5">
            {mes ? mesLabel(mes) : 'Todos os períodos'}
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setFormErr('') }}
          className="btn-primary text-sm"
        >
          + Novo Lançamento Manual
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3">
        <select
          value={mes}
          onChange={e => setMes(e.target.value)}
          className="input text-sm py-1.5 min-w-[180px]"
        >
          {meses.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>

        <select
          value={categ}
          onChange={e => setCateg(e.target.value)}
          className="input text-sm py-1.5"
        >
          <option value="">Todas as categorias</option>
          <option value="usicrom">Usicrom</option>
          <option value="timbro">Timbro</option>
          <option value="manual">Manual</option>
        </select>

        <select
          value={origem}
          onChange={e => setOrigem(e.target.value)}
          className="input text-sm py-1.5"
        >
          <option value="">Qualquer origem</option>
          <option value="manual">Manual</option>
          <option value="automatico">Automático</option>
        </select>
      </div>

      {/* ── Summary cards ── */}
      {resumo && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card space-y-1">
            <p className="text-xs text-text-faint uppercase tracking-wider">Receitas</p>
            <p className="text-2xl font-bold text-green-400">{fmtBRL(resumo.totalReceitas)}</p>
            <p className="text-text-faint text-xs">{resumo.count} lançamento(s)</p>
          </div>
          <div className="card space-y-1">
            <p className="text-xs text-text-faint uppercase tracking-wider">Despesas</p>
            <p className="text-2xl font-bold text-red-400">{fmtBRL(resumo.totalDespesas)}</p>
          </div>
          <div className="card space-y-1">
            <p className="text-xs text-text-faint uppercase tracking-wider">Saldo</p>
            <p className={`text-2xl font-bold ${resumo.saldo >= 0 ? 'text-blue-glow' : 'text-red-400'}`}>
              {fmtBRL(resumo.saldo)}
            </p>
          </div>
        </div>
      )}

      {/* ── Novo Lançamento Form ── */}
      {showForm && (
        <div className="card border border-bg-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-text">Novo Lançamento Manual</h2>
            <button
              onClick={() => { setShowForm(false); setForm(BLANK_FORM); setFormErr('') }}
              className="text-text-faint hover:text-text text-lg leading-none"
            >
              ×
            </button>
          </div>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Data *</label>
              <input
                type="date"
                className="input"
                value={form.data}
                onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">Tipo *</label>
              <select
                className="input"
                value={form.tipo}
                onChange={e => setForm(f => ({ ...f, tipo: e.target.value as 'receita' | 'despesa' }))}
              >
                <option value="receita">Receita</option>
                <option value="despesa">Despesa</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Descrição *</label>
              <input
                type="text"
                className="input"
                value={form.descricao}
                onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                placeholder="Ex: Pagamento fatura fornecedor"
                required
              />
            </div>
            <div>
              <label className="label">Categoria *</label>
              <select
                className="input"
                value={form.categoria}
                onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
              >
                <option value="manual">Manual</option>
                <option value="usicrom">Usicrom</option>
                <option value="timbro">Timbro</option>
              </select>
            </div>
            <div>
              <label className="label">Valor (R$) *</label>
              <input
                type="number"
                className="input"
                min="0.01"
                step="0.01"
                value={form.valor}
                onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
                placeholder="0,00"
                required
              />
            </div>
            <div>
              <label className="label">Conta / Banco</label>
              <input
                type="text"
                className="input"
                value={form.conta}
                onChange={e => setForm(f => ({ ...f, conta: e.target.value }))}
                placeholder="Ex: Banco do Brasil"
              />
            </div>

            {formErr && (
              <p className="sm:col-span-2 text-red-400 text-sm">{formErr}</p>
            )}

            <div className="sm:col-span-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setShowForm(false); setForm(BLANK_FORM); setFormErr('') }}
                className="btn-ghost text-sm"
              >
                Cancelar
              </button>
              <button type="submit" disabled={saving} className="btn-primary text-sm">
                {saving ? 'Salvando...' : 'Salvar Lançamento'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="rounded-lg bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* ── Table ── */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-text-muted text-sm">Carregando lançamentos...</div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center text-text-muted text-sm">
            Nenhum lançamento encontrado para os filtros selecionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-bg-border text-text-faint text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3 font-medium">Data</th>
                  <th className="text-left px-4 py-3 font-medium">Descrição</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Categoria</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Tipo</th>
                  <th className="text-right px-4 py-3 font-medium">Valor</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Origem / Vínculo</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-bg-border">
                {data.map(l => {
                  const isReceita = l.tipo === 'receita'
                  const vinculo = l.orcamentoUsicrom
                    ? `Usicrom ${l.orcamentoUsicrom.numero} · ${l.orcamentoUsicrom.cliente.razaoSocial}`
                    : l.orcamentoTimbro
                    ? `Timbro ${l.orcamentoTimbro.numero} · ${l.orcamentoTimbro.cliente.razaoSocial}`
                    : '—'

                  return (
                    <tr key={l.id} className="hover:bg-bg-hover transition-colors">
                      <td className="px-4 py-3 text-text-muted whitespace-nowrap">
                        {fmtData(l.data)}
                      </td>
                      <td className="px-4 py-3 text-text max-w-[280px]">
                        <p className="truncate">{l.descricao}</p>
                        {l.conta && (
                          <p className="text-text-faint text-xs mt-0.5">{l.conta}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={`badge ${
                          l.categoria === 'usicrom' ? 'badge-blue'
                          : l.categoria === 'timbro' ? 'badge-purple'
                          : 'badge-gray'
                        }`}>
                          {l.categoria}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className={`badge ${isReceita ? 'badge-green' : 'badge-red'}`}>
                          {isReceita ? 'Receita' : 'Despesa'}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${
                        isReceita ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {isReceita ? '+' : '-'} {fmtBRL(l.valor)}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-text-faint text-xs">
                        <p>{l.origem}</p>
                        <p className="mt-0.5 truncate max-w-[200px]">{vinculo}</p>
                      </td>
                      <td className="px-4 py-3">
                        {l.origem === 'manual' && (
                          <button
                            onClick={() => handleDelete(l.id)}
                            disabled={deleting === l.id}
                            title="Excluir lançamento"
                            className="text-text-faint hover:text-red-400 transition-colors disabled:opacity-50"
                          >
                            {deleting === l.id ? '…' : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
