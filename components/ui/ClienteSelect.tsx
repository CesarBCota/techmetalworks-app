'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface Cliente {
  id: string
  razaoSocial: string
  cnpj: string
  fatCidade?: string
  fatUf?: string
}

interface ClienteSelectProps {
  value?: string
  onChange: (id: string, cliente?: Cliente) => void
  required?: boolean
}

function formatCNPJ(cnpj: string) {
  const n = cnpj.replace(/\D/g, '')
  return n.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') || cnpj
}

export function ClienteSelect({ value, onChange, required }: ClienteSelectProps) {
  const [query, setQuery]           = useState('')
  const [clientes, setClientes]     = useState<Cliente[]>([])
  const [selecionado, setSelecionado] = useState<Cliente | null>(null)
  const [open, setOpen]             = useState(false)
  const [loading, setLoading]       = useState(false)
  const wrapperRef                  = useRef<HTMLDivElement>(null)

  // Carregar cliente inicial quando value muda
  useEffect(() => {
    if (!value) { setSelecionado(null); setQuery(''); return }
    if (selecionado && String(selecionado.id) === value) return
    fetch(`/api/clientes/${value}`)
      .then(r => r.json())
      .then((c: Cliente) => { setSelecionado(c); setQuery(c.razaoSocial) })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  // Busca debounced
  useEffect(() => {
    if (!open) return
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/clientes?q=${encodeURIComponent(query)}&limit=20`)
        const data = await res.json()
        setClientes(Array.isArray(data) ? data : data.clientes ?? [])
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [query, open])

  // Fechar ao clicar fora
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function selecionar(c: Cliente) {
    setSelecionado(c)
    setQuery(c.razaoSocial)
    setOpen(false)
    onChange(c.id, c)
  }

  function limpar() {
    setSelecionado(null)
    setQuery('')
    onChange('', undefined)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          className="input pr-8"
          placeholder="Buscar cliente por nome ou CNPJ…"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); if (!e.target.value) limpar() }}
          onFocus={() => setOpen(true)}
          required={required && !selecionado}
          readOnly={!!selecionado}
        />
        {selecionado ? (
          <button
            type="button" onClick={limpar}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-text-faint hover:text-text"
          >✕</button>
        ) : (
          <svg
            className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint pointer-events-none"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        )}
      </div>

      {selecionado && (
        <div className="mt-1 text-xs text-text-muted">
          CNPJ: {formatCNPJ(selecionado.cnpj)}
          {selecionado.fatCidade && ` · ${selecionado.fatCidade}/${selecionado.fatUf}`}
        </div>
      )}

      {open && !selecionado && (
        <div className="absolute z-50 mt-1 w-full bg-bg-card border border-bg-border rounded-lg shadow-xl max-h-64 overflow-auto">
          {loading && <div className="px-3 py-2 text-sm text-text-muted">Buscando…</div>}
          {!loading && clientes.length === 0 && (
            <div className="px-3 py-4 text-center">
              <div className="text-sm text-text-muted mb-1">Nenhum cliente encontrado</div>
              <a href="/clientes/novo" className="text-xs text-blue-glow hover:underline">+ Cadastrar novo cliente</a>
            </div>
          )}
          {clientes.map(c => (
            <button
              key={c.id} type="button" onClick={() => selecionar(c)}
              className={cn(
                'w-full text-left px-3 py-2.5 hover:bg-bg-hover transition-colors',
                selecionado && (selecionado as Cliente).id === c.id && 'bg-blue-deep/30'
              )}
            >
              <div className="text-sm font-medium text-text">{c.razaoSocial}</div>
              <div className="text-xs text-text-muted">
                {formatCNPJ(c.cnpj)}{c.fatCidade ? ` · ${c.fatCidade}/${c.fatUf}` : ''}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ClienteSelect
