'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      })
      const data = await res.json()

      if (!res.ok || !data.ok) {
        setErro(data.erro || 'Erro ao fazer login')
      } else {
        router.push('/')
        router.refresh()
      }
    } catch {
      setErro('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-deep border border-blue-mid mb-4">
            <svg className="w-7 h-7 text-blue-glow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text">Tech Metalworks</h1>
          <p className="text-text-muted text-sm mt-1">Gestão Comercial</p>
        </div>

        {/* Card de login */}
        <div className="bg-bg-card border border-bg-border rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">E-mail</label>
              <input
                type="email"
                className="input"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            <div>
              <label className="label">Senha</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {erro && (
              <div className="bg-red-900/20 border border-red-700/50 rounded-lg px-3 py-2 text-red-400 text-sm">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 mt-2"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-text-faint text-xs mt-6">
          Tech Metalworks Representações Comerciais
        </p>
      </div>
    </div>
  )
}
