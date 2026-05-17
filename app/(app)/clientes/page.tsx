'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface Cliente {
  id: string
  razaoSocial: string
  cnpj: string | null
  fatCidade: string | null
  fatUf: string | null
  email: string | null
  telefone: string | null
  _count: { orcamentosUsicrom: number; orcamentosTimbro: number }
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)

  const carregar = useCallback(async (q: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/clientes?q=${encodeURIComponent(q)}&limit=100`)
      const data = await res.json()
      setClientes(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => carregar(busca), 300)
    return () => clearTimeout(t)
  }, [busca, carregar])

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Clientes</h1>
          <p className="text-text-muted text-sm mt-1">{clientes.length} cadastrado{clientes.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/clientes/novo" className="btn-primary">+ Novo Cliente</Link>
      </div>

      <div className="card mb-4">
        <input
          type="text"
          placeholder="Buscar por nome, CNPJ ou cidade..."
          className="input w-full"
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center text-text-muted py-12">Carregando...</div>
      ) : clientes.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-text-muted text-lg">Nenhum cliente encontrado</p>
          {busca && <button onClick={() => setBusca('')} className="btn-ghost mt-3">Limpar busca</button>}
          {!busca && <Link href="/clientes/novo" className="btn-primary mt-4 inline-block">Cadastrar primeiro cliente</Link>}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-bg-border">
                  <th className="text-left text-text-muted text-xs font-semibold uppercase tracking-wider px-4 py-3">Empresa</th>
                  <th className="text-left text-text-muted text-xs font-semibold uppercase tracking-wider px-4 py-3 hidden sm:table-cell">CNPJ</th>
                  <th className="text-left text-text-muted text-xs font-semibold uppercase tracking-wider px-4 py-3 hidden md:table-cell">Cidade / UF</th>
                  <th className="text-center text-text-muted text-xs font-semibold uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Orçamentos</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((c) => (
                  <tr key={c.id} className="table-row">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-text text-sm">{c.razaoSocial}</div>
                    </td>
                    <td className="px-4 py-3 text-text-muted text-sm mono hidden sm:table-cell">{c.cnpj || '—'}</td>
                    <td className="px-4 py-3 text-text-muted text-sm hidden md:table-cell">
                      {c.fatCidade && c.fatUf ? `${c.fatCidade} / ${c.fatUf}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-center text-text-muted text-sm hidden lg:table-cell">
                      {c._count.orcamentosUsicrom + c._count.orcamentosTimbro}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/clientes/${c.id}`} className="text-blue-glow hover:text-blue-light text-sm font-medium">
                        Editar →
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
