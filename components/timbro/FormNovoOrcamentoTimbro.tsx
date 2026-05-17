'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ClienteSelect } from '@/components/ui/ClienteSelect'
import { calcularTimbro, FONTES_TIMBRO, FonteTimbro, ResultadoTimbro } from '@/lib/calculos-timbro'

const FONTES = Object.entries(FONTES_TIMBRO) as [FonteTimbro, typeof FONTES_TIMBRO[FonteTimbro]][]

const fmtUsd = (v: number) =>
  v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtBrl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface Props {
  orcamentoId?: string  // se presente, modo edição
  initialData?: {
    clienteId: string
    dataValidade: string
    fonte: FonteTimbro
    lmeUsdTon: number
    premioUsdTon: number
    acrescimoUsdTon: number
    cambioDolar: number
    quantidadeTon: number
    prazoEntrega?: string
    condicoesPagamento?: string
    observacao?: string
  }
}

export function FormNovoOrcamentoTimbro({ orcamentoId, initialData }: Props) {
  const router = useRouter()
  const isEdicao = !!orcamentoId

  const hoje = new Date()
  const validadePadrao = new Date(hoje)
  validadePadrao.setDate(hoje.getDate() + 15)

  const [clienteId, setClienteId] = useState(initialData?.clienteId ?? '')
  const [dataValidade, setDataValidade] = useState(
    initialData?.dataValidade
      ? initialData.dataValidade.slice(0, 10)
      : validadePadrao.toISOString().slice(0, 10)
  )
  const [fonte, setFonte] = useState<FonteTimbro>(initialData?.fonte ?? 'lingote_al')
  const [lme, setLme] = useState(String(initialData?.lmeUsdTon ?? ''))
  const [premio, setPremio] = useState(String(initialData?.premioUsdTon ?? ''))
  const [acrescimo, setAcrescimo] = useState(String(initialData?.acrescimoUsdTon ?? '0'))
  const [cambio, setCambio] = useState(String(initialData?.cambioDolar ?? ''))
  const [quantidade, setQuantidade] = useState(String(initialData?.quantidadeTon ?? '1'))
  const [prazoEntrega, setPrazoEntrega] = useState(initialData?.prazoEntrega ?? '')
  const [condicoesPagamento, setCondicoesPagamento] = useState(initialData?.condicoesPagamento ?? '')
  const [observacao, setObservacao] = useState(initialData?.observacao ?? '')

  const [resultado, setResultado] = useState<ResultadoTimbro | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const recalcular = useCallback(() => {
    const l = parseFloat(lme)
    const p = parseFloat(premio)
    const a = parseFloat(acrescimo) || 0
    const c = parseFloat(cambio)
    const q = parseFloat(quantidade) || 1

    if (isNaN(l) || isNaN(p) || isNaN(c) || l <= 0 || p < 0 || c <= 0) {
      setResultado(null)
      return
    }

    setResultado(calcularTimbro({
      fonte,
      lmeUsdTon: l,
      premioUsdTon: p,
      acrescimoUsdTon: a,
      cambioDolar: c,
      quantidadeTon: q,
    }))
  }, [fonte, lme, premio, acrescimo, cambio, quantidade])

  useEffect(() => { recalcular() }, [recalcular])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!clienteId) { setErro('Selecione um cliente.'); return }
    if (!resultado) { setErro('Preencha os dados de cálculo.'); return }

    setSalvando(true)
    setErro('')

    const payload = {
      clienteId,
      dataValidade,
      fonte,
      lmeUsdTon: resultado.lmeUsdTon,
      premioUsdTon: resultado.premioUsdTon,
      acrescimoUsdTon: resultado.acrescimoUsdTon,
      cambioDolar: resultado.cambioDolar,
      quantidadeTon: resultado.quantidadeTon,
      prazoEntrega,
      condicoesPagamento,
      observacao,
    }

    try {
      const url = isEdicao ? `/api/timbro/${orcamentoId}` : '/api/timbro'
      const method = isEdicao ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro')
      router.push(`/timbro/${data.id}`)
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setSalvando(false)
    }
  }

  const config = FONTES_TIMBRO[fonte]

  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {/* Cliente + validade */}
      <section className="card space-y-4">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Dados do Orçamento</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-text-muted mb-1">Cliente *</label>
            <ClienteSelect value={clienteId} onChange={setClienteId} required />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Validade</label>
            <input
              type="date"
              value={dataValidade}
              onChange={e => setDataValidade(e.target.value)}
              className="input w-full"
              required
            />
          </div>
        </div>
      </section>

      {/* Fonte / zinco */}
      <section className="card space-y-4">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Fonte de Zinco</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {FONTES.map(([key, cfg]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFonte(key)}
              className={`rounded-lg border p-3 text-left transition-all ${
                fonte === key
                  ? 'border-blue-glow bg-blue-glow/10 text-text'
                  : 'border-border text-text-muted hover:border-blue-glow/50'
              }`}
            >
              <div className="text-xs font-medium">{cfg.label}</div>
              <div className="text-xs text-text-muted mt-1">
                {cfg.percImpostos}% imp · {cfg.percDespachante}% desp
              </div>
            </button>
          ))}
        </div>

        <div className="flex gap-4 text-xs text-text-muted bg-bg-card rounded p-3 border border-border">
          <span>Impostos: <strong className="text-text">{config.percImpostos}%</strong></span>
          <span>Despachante: <strong className="text-text">{config.percDespachante}%</strong></span>
          <span>Total encargos: <strong className="text-blue-glow">{(config.percImpostos + config.percDespachante).toFixed(2)}%</strong></span>
        </div>
      </section>

      {/* Calculadora LME */}
      <section className="card space-y-4">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Calculadora LME</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-text-muted mb-1">LME (USD/ton) *</label>
            <input
              type="number"
              step="0.01"
              value={lme}
              onChange={e => setLme(e.target.value)}
              className="input w-full"
              placeholder="ex: 2850.00"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Prêmio (USD/ton) *</label>
            <input
              type="number"
              step="0.01"
              value={premio}
              onChange={e => setPremio(e.target.value)}
              className="input w-full"
              placeholder="ex: 120.00"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Acréscimo Tech Metalworks (USD/ton) <span className="text-yellow-400">ex: 30, 50</span></label>
            <input
              type="number"
              step="0.01"
              value={acrescimo}
              onChange={e => setAcrescimo(e.target.value)}
              className="input w-full"
              placeholder="ex: 50.00"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Câmbio (R$/USD) *</label>
            <input
              type="number"
              step="0.001"
              value={cambio}
              onChange={e => setCambio(e.target.value)}
              className="input w-full"
              placeholder="ex: 5.10"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Quantidade (ton)</label>
            <input
              type="number"
              step="0.001"
              min="0.001"
              value={quantidade}
              onChange={e => setQuantidade(e.target.value)}
              className="input w-full"
              placeholder="ex: 24.5"
            />
          </div>
        </div>

        {/* Preview do cálculo */}
        {resultado ? (
          <div className="mt-2 rounded-lg border border-border bg-bg-card p-4 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-xs text-text-muted">Base (LME + prêmio + acréscimo)</div>
                <div className="font-mono font-semibold text-text">USD {fmtUsd(resultado.baseUsdTon)}/ton</div>
              </div>
              <div>
                <div className="text-xs text-text-muted">Preço final c/ encargos</div>
                <div className="font-mono font-semibold text-blue-glow">USD {fmtUsd(resultado.precoFinalUsdTon)}/ton</div>
              </div>
              <div>
                <div className="text-xs text-text-muted">Preço em R$</div>
                <div className="font-mono font-semibold text-text">{fmtBrl(resultado.precoFinalBrlTon)}/ton</div>
              </div>
              <div>
                <div className="text-xs text-text-muted">Quantidade</div>
                <div className="font-mono text-text">{resultado.quantidadeTon.toFixed(3)} ton</div>
              </div>
              <div>
                <div className="text-xs text-text-muted">Total USD</div>
                <div className="font-mono font-semibold text-text">USD {fmtUsd(resultado.valorTotalUsd)}</div>
              </div>
              <div>
                <div className="text-xs text-text-muted">Total R$</div>
                <div className="font-mono font-bold text-green-400 text-lg">{fmtBrl(resultado.valorTotalBrl)}</div>
              </div>
            </div>

            {resultado.acrescimoUsdTon > 0 && (
              <div className="pt-2 border-t border-border text-xs text-text-muted flex gap-4">
                <span>Comissão TL bruta: USD {fmtUsd(resultado.valorAcrescimoUsd)}</span>
                <span>→ {fmtBrl(resultado.valorAcrescimoBrl)}</span>
                <span className="text-yellow-400">(receita da Tech Metalworks)</span>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-text-muted">
            Preencha LME, prêmio e câmbio para ver o cálculo.
          </div>
        )}
      </section>

      {/* Condições comerciais */}
      <section className="card space-y-4">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Condições Comerciais</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-text-muted mb-1">Prazo de Entrega</label>
            <input
              type="text"
              value={prazoEntrega}
              onChange={e => setPrazoEntrega(e.target.value)}
              className="input w-full"
              placeholder="ex: 30 dias corridos"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Condições de Pagamento</label>
            <input
              type="text"
              value={condicoesPagamento}
              onChange={e => setCondicoesPagamento(e.target.value)}
              className="input w-full"
              placeholder="ex: 30/60/90 DDL"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1">Observações</label>
          <textarea
            value={observacao}
            onChange={e => setObservacao(e.target.value)}
            rows={3}
            className="input w-full resize-none"
            placeholder="Informações adicionais..."
          />
        </div>
      </section>

      {erro && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
          {erro}
        </div>
      )}

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={salvando || !resultado || !clienteId}
          className="btn-primary"
        >
          {salvando ? 'Salvando...' : isEdicao ? 'Salvar Alterações' : 'Criar Orçamento'}
        </button>
      </div>
    </form>
  )
}

export default FormNovoOrcamentoTimbro
