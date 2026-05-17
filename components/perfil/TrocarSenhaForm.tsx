'use client'

import { useState } from 'react'

export default function TrocarSenhaForm() {
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setSucesso(false)

    if (novaSenha !== confirmar) {
      setErro('A nova senha e a confirmação não coincidem.')
      return
    }

    if (novaSenha.length < 6) {
      setErro('A nova senha deve ter pelo menos 6 caracteres.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/perfil/senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senhaAtual, novaSenha }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErro(data.error || 'Erro ao alterar senha.')
      } else {
        setSucesso(true)
        setSenhaAtual('')
        setNovaSenha('')
        setConfirmar('')
      }
    } catch {
      setErro('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
      {/* Senha atual */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Senha atual
        </label>
        <input
          type="password"
          value={senhaAtual}
          onChange={(e) => setSenhaAtual(e.target.value)}
          required
          autoComplete="current-password"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Nova senha */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nova senha
        </label>
        <input
          type="password"
          value={novaSenha}
          onChange={(e) => setNovaSenha(e.target.value)}
          required
          autoComplete="new-password"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">Mínimo de 6 caracteres.</p>
      </div>

      {/* Confirmar nova senha */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Confirmar nova senha
        </label>
        <input
          type="password"
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
          required
          autoComplete="new-password"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Erro */}
      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {erro}
        </div>
      )}

      {/* Sucesso */}
      {sucesso && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
          ✅ Senha alterada com sucesso!
        </div>
      )}

      {/* Botão */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors"
      >
        {loading ? 'Salvando…' : 'Alterar senha'}
      </button>
    </form>
  )
}
