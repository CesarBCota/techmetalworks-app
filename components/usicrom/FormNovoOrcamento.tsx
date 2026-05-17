'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ClienteSelect } from '@/components/ui/ClienteSelect'
import { ItemOrcamentoRow } from '@/components/usicrom/ItemOrcamentoRow'
import { ESTADOS_BRASILEIROS, calcularAliquotaIcms } from '@/lib/icms'

interface Representante {
  id: string
  nome: string
  percComissao: number
}

interface Props {
  representantes: Representante[]
}

interface ItemForm {
  id: string
  tipoProduto: string
  descricao: string
  parametrosJson: Record<string, unknown>
  quantidade: number
  pesoPretoKg: number
  pesoGalvKg: number
  precoKgUsicrom: number
  precoUnitSemIpi: number
  precoTotalSemIpi: number
  aliquotaIcms: number
  pisCofins: number
  aliquotaIpi: number
  valorSt: number
  valorIpi: number
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

// Marcelo: comissão fixa de representação
const PERC_MARCELO = 2.65

export function FormNovoOrcamento({ representantes }: Props) {
  const router = useRouter()

  const [clienteId, setClienteId] = useState('')
  const [ufDestino, setUfDestino] = useState('SP')
  const [repId, setRepId] = useState(representantes[0]?.id || '')
  // Total da comissão sobre o cliente (padrão 7%)
  // percRep = PERC_MARCELO (fixo), percTecno = total - percRep
  const [totalComissao, setTotalComissao] = useState(7.0)
  const [prazoEntrega, setPrazoEntrega] = useState('')
  const [condicoesPagamento, setCondicoesPagamento] = useState('')
  const [observacao, setObservacao] = useState('')
  const [validadeDias, setValidadeDias] = useState(10)
  const [itens, setItens] = useState<ItemForm[]>([])
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const percRep = PERC_MARCELO
  const percTecno = Math.max(0, totalComissao - PERC_MARCELO)

  const aliquotaIcms = calcularAliquotaIcms(ufDestino)

  // Ao selecionar cliente: auto-preencher UF de destino
  function handleClienteChange(id: string, cliente?: { fatUf?: string }) {
    setClienteId(id)
    if (cliente?.fatUf) {
      const uf = cliente.fatUf.toUpperCase()
      setUfDestino(uf)
      const aliq = calcularAliquotaIcms(uf)
      setItens(prev => prev.map(i => ({ ...i, aliquotaIcms: aliq })))
    }
  }

  function handleUfChange(uf: string) {
    setUfDestino(uf)
    const aliq = calcularAliquotaIcms(uf)
    setItens(prev => prev.map(i => ({ ...i, aliquotaIcms: aliq })))
  }

  function adicionarItem() {
    const novoItem: ItemForm = {
      id: Math.random().toString(36).slice(2),
      tipoProduto: 'conico_continuo',
      descricao: '',
      parametrosJson: {},
      quantidade: 1,
      pesoPretoKg: 0,
      pesoGalvKg: 0,
      precoKgUsicrom: 0,
      precoUnitSemIpi: 0,
      precoTotalSemIpi: 0,
      aliquotaIcms,
      pisCofins: 9.25,
      aliquotaIpi: 0,
      valorSt: 0,
      valorIpi: 0,
    }
    setItens(prev => [...prev, novoItem])
  }

  const atualizarItem = useCallback((id: string, dados: Partial<ItemForm>) => {
    setItens(prev => prev.map(i => i.id === id ? { ...i, ...dados } : i))
  }, [])

  function removerItem(id: string) {
    setItens(prev => prev.filter(i => i.id !== id))
  }

  // Totais
  const totalUsicrom = itens.reduce((s, i) => s + (i.precoKgUsicrom * i.pesoGalvKg * i.quantidade), 0)
  const totalFinal = itens.reduce((s, i) => s + i.precoTotalSemIpi, 0)
  const totalPesoPreto = itens.reduce((s, i) => s + i.pesoPretoKg * i.quantidade, 0)
  const totalPesoGalv = itens.reduce((s, i) => s + i.pesoGalvKg * i.quantidade, 0)
  const comissaoRep = totalFinal * (percRep / 100)
  const comissaoTecno = totalFinal * (percTecno / 100)

  async function salvar() {
    if (!clienteId) { setErro('Selecione um cliente.'); return }
    if (itens.length === 0) { setErro('Adicione ao menos um item.'); return }
    setSalvando(true)
    setErro('')
    try {
      const res = await fetch('/api/usicrom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId,
          representanteId: repId || null,
          percRepresentante: percRep,
          percTecnoLumen: percTecno,
          prazoEntrega,
          condicoesPagamento,
          observacao,
          validadeDias,
          itens: itens.map(({ id: _id, ...rest }) => rest),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setErro(data.error || 'Erro ao salvar.'); return }
      router.push(`/usicrom/${data.id}`)
    } catch {
      setErro('Erro de conexão.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Cliente e destino ── */}
      <div className="card space-y-4">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Dados do Orçamento</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label">Cliente *</label>
            <ClienteSelect value={clienteId} onChange={handleClienteChange} />
          </div>

          <div>
            <label className="label">
              UF de Destino
              <span className="ml-1 text-text-muted font-normal">(ICMS auto · saída MG)</span>
            </label>
            <select
              className="input"
              value={ufDestino}
              onChange={e => handleUfChange(e.target.value)}
            >
              {ESTADOS_BRASILEIROS.map(e => {
                const aliq = calcularAliquotaIcms(e.sigla)
                return (
                  <option key={e.sigla} value={e.sigla}>
                    {e.sigla} — {e.nome} (ICMS {aliq}%)
                  </option>
                )
              })}
            </select>
            <p className="mt-1 text-xs text-blue-glow">
              ICMS aplicado: {aliquotaIcms}% — MG → {ufDestino}
            </p>
          </div>

          <div>
            <label className="label">Validade (dias)</label>
            <input
              type="number"
              className="input"
              value={validadeDias}
              onChange={e => setValidadeDias(Number(e.target.value))}
              min={1} max={365}
            />
          </div>
        </div>
      </div>

      {/* ── Representante e comissões ── */}
      <div className="card space-y-4">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Representante & Comissões</h2>
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
              step={0.05} min={PERC_MARCELO} max={15}
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

      {/* ── Condições comerciais ── */}
      <div className="card space-y-4">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Condições Comerciais</h2>
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

      {/* ── Itens ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-text">Itens</h2>
          <button onClick={adicionarItem} className="btn-primary text-sm">+ Adicionar Item</button>
        </div>

        {itens.length === 0 ? (
          <div className="card text-center py-10 text-text-muted">
            <p>Nenhum item adicionado.</p>
            <button onClick={adicionarItem} className="btn-ghost mt-3">Adicionar primeiro item</button>
          </div>
        ) : (
          <div className="space-y-3">
            {itens.map((item, idx) => (
              <ItemOrcamentoRow
                key={item.id}
                item={item}
                index={idx}
                aliquotaIcms={aliquotaIcms}
                percRep={percRep}
                percTecno={percTecno}
                onChange={dados => atualizarItem(item.id, dados)}
                onRemove={() => removerItem(item.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Totais ── */}
      {itens.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Resumo</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <div className="text-text-muted text-xs mb-1">Peso Preto</div>
              <div className="text-text font-semibold">{totalPesoPreto.toFixed(1)} kg</div>
            </div>
            <div>
              <div className="text-text-muted text-xs mb-1">Peso Galvanizado</div>
              <div className="text-text font-semibold">{totalPesoGalv.toFixed(1)} kg</div>
            </div>
            <div>
              <div className="text-text-muted text-xs mb-1">Custo Usicrom</div>
              <div className="text-text font-semibold">{fmt(totalUsicrom)}</div>
            </div>
            <div>
              <div className="text-text-muted text-xs mb-1">Valor ao Cliente</div>
              <div className="text-blue-glow font-bold text-lg">{fmt(totalFinal)}</div>
            </div>
            <div>
              <div className="text-text-muted text-xs mb-1">Marcelo ({percRep}%)</div>
              <div className="text-text font-semibold">{fmt(comissaoRep)}</div>
            </div>
            <div>
              <div className="text-text-muted text-xs mb-1">Tecno Lumen ({percTecno.toFixed(2)}%)</div>
              <div className="text-green-400 font-bold">{fmt(comissaoTecno)}</div>
            </div>
          </div>
        </div>
      )}

      {erro && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-red-400 text-sm">{erro}</div>
      )}

      <div className="flex justify-end gap-3 pb-6">
        <button onClick={() => router.back()} className="btn-ghost">Cancelar</button>
        <button onClick={salvar} disabled={salvando} className="btn-primary">
          {salvando ? 'Salvando...' : 'Criar Orçamento'}
        </button>
      </div>
    </div>
  )
}
