'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ClienteSelect } from '@/components/ui/ClienteSelect'

interface Representante {
  id: string
  nome: string
  percComissao: number
}

interface InitialData {
  clienteId:          string
  representanteId:    string | null
  percRepresentante:  number
  percTecnoLumen:     number
  validadeDias:       number
  prazoEntrega:       string
  condicoesPagamento: string
  observacao:         string
}

interface Props {
  orcamentoId:   string
  numero:        string
  representantes: Representante[]
  initialData:   InitialData
}

const PERC_MARCELO = 2.65

export function EditarOrcamentoForm({ orcamentoId, numero, representantes, initialData }: Props) {
  const router = useRouter()

  const [clienteId,          setClienteId]          = useState(initialData.clienteId)
  const [repId,              setRepId]               = useState(initialData.representanteId ?? '')
  const [totalComissao,      setTotalComissao]       = useState(
    Number((initialData.percRepresentante + initialData.percTecnoLumen).toFixed(4)),
  )
  const [validadeDias,       setValidadeDias]        = useState(initialData.validadeDias)
  const [prazoEntrega,       setPrazoEntrega]        = useState(initialData.prazoEntrega)
  const [condicoesPagamento, setCondicoesPagamento]  = useState(initialData.condicoesPagamento)
  const [observacao,         setObservacao]          = useState(initialData.observacao)
  const [salvando,           setSalvando]            = useState(false)
  const [erro,               setErro]                = useState('')

  const percRep   = PERC_MARCELO
  const percTecno = Math.max(0, totalComissao - PERC_MARCELO)

  async function salvar() {
    if (!clienteId) { setErro('Selecione um cliente.'); return }
    setSalvando(true)
    setErro('')
    try {
      const res = await fetch(`/api/usicrom/${orcamentoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId,
          representanteId:    repId || null,
          percRepresentante:  percRep,
          percTecnoLumen:     percTecno,
          validadeDias,
          prazoEntrega,
          condicoesPagamento,
          observacao,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setErro(data.error || 'Erro ao salvar.'); return }
      router.push(`/usicrom/${orcamentoId}`)
      router.refresh()
    } catch {
      setErro('Erro de conexão.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="space-y-5">

      {/* ── Cliente ── */}
      <div className="card space-y-4">
        <h2 className="form-section-title">Dados do Orçamento</h2>

        <div>
          <label className="label">Cliente *</label>
          <ClienteSelect value={clienteId} onChange={(id) => setClienteId(id)} />
        </div>

        <div>
          <label className="label">Validade (dias a partir de hoje)</label>
          <input
            type="number"
            className="input"
            value={validadeDias}
            onChange={e => setValidadeDias(Number(e.target.value))}
            min={1}
            max={365}
          />
          <p className="mt-1 text-xs text-text-faint">
            Ao salvar, a data de validade será recalculada com base em hoje.
          </p>
        </div>
      </div>

      {/* ── Representante & Comissões ── */}
      <div className="card space-y-4">
        <h2 className="form-section-title">Representante &amp; Comissões</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="label">Representante</label>
            <select className="input" value={repId} onChange={e => setRepId(e.target.value)}>
              <option value="">— Nenhum —</option>
              {representantes.map(r => (
                <option key={r.id} value={r.id}>{r.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">% Marcelo (fixo)</label>
            <div className="input bg-bg-card/50 text-text-muted cursor-default flex items-center">
              {percRep.toFixed(2)}%
            </div>
          </div>
          <div>
            <label className="label">% Total sobre cliente</label>
            <input
              type="number"
              className="input"
              value={totalComissao}
              onChange={e => setTotalComissao(Number(e.target.value))}
              step={0.05}
              min={PERC_MARCELO}
              max={15}
            />
          </div>
          <div>
            <label className="label">% Tech Metalworks</label>
            <div className="input bg-bg-card/50 text-green-400 font-semibold cursor-default flex items-center">
              {percTecno.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      {/* ── Condições Comerciais ── */}
      <div className="card space-y-4">
        <h2 className="form-section-title">Condições Comerciais</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Condições de Pagamento</label>
            <input
              className="input"
              value={condicoesPagamento}
              onChange={e => setCondicoesPagamento(e.target.value)}
              placeholder="Ex: 30/60/90 dias, boleto"
            />
          </div>
          <div>
            <label className="label">Prazo de Entrega</label>
            <input
              className="input"
              value={prazoEntrega}
              onChange={e => setPrazoEntrega(e.target.value)}
              placeholder="Ex: 30 dias úteis"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Observações</label>
            <textarea
              className="input h-20 resize-none"
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
              placeholder="Observações que aparecerão no PDF..."
            />
          </div>
        </div>
      </div>

      {/* ── Aviso itens ── */}
      <div className="rounded-lg border border-amber-700/50 bg-amber-900/10 px-4 py-3 text-sm text-amber-400">
        Os itens do orçamento não são editáveis aqui. Para recalcular itens, crie um novo orçamento.
      </div>

      {erro && (
        <div className="rounded-lg border border-red-700 bg-red-900/30 px-4 py-3 text-sm text-red-400">
          {erro}
        </div>
      )}

      <div className="flex justify-end gap-3 pb-6">
        <button type="button" onClick={() => router.back()} className="btn-ghost">
          Cancelar
        </button>
        <button type="button" onClick={salvar} disabled={salvando} className="btn-primary">
          {salvando ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>
    </div>
  )
}
