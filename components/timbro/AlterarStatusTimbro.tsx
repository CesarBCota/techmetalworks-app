'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { STATUS_CONFIG } from '@/lib/utils'

const TRANSICOES: Record<string, string[]> = {
  rascunho: ['enviado'],
  enviado:  ['aprovado', 'perdido', 'rascunho'],
  aprovado: ['perdido'],
  perdido:  [],
  expirado: [],
}

export function AlterarStatusTimbro({
  orcId,
  statusAtual,
}: {
  orcId: string
  statusAtual: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const proximos = TRANSICOES[statusAtual] ?? []
  if (proximos.length === 0) return null

  async function alterarStatus(novoStatus: string) {
    setLoading(true)
    setShowMenu(false)
    try {
      await fetch(`/api/timbro/${orcId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ novoStatus }),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={loading}
        className="btn-secondary text-sm flex items-center gap-2"
      >
        {loading ? 'Atualizando...' : 'Mudar Status'}
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-bg-card border border-border rounded-lg shadow-xl min-w-[160px] overflow-hidden">
            {proximos.map(status => {
              const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]
              return (
                <button
                  key={status}
                  onClick={() => alterarStatus(status)}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-bg-hover flex items-center gap-2"
                >
                  <span className={`badge ${cfg?.color ?? ''}`}>{cfg?.label ?? status}</span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

export default AlterarStatusTimbro
