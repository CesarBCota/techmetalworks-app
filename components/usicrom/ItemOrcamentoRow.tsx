'use client'

import { useEffect, useState } from 'react'
import {
  calcularPoleConico, calcularPoleTeleconico, calcularPolePoligonal,
  calcularBraco, calcularChumbadores, calcularFlange,
  calcularPrecoFinal, PRECO_KG, galvanizar,
} from '@/lib/calculos-usicrom'
import { cn } from '@/lib/utils'

const TIPOS_PRODUTO = [
  { value: 'conico_continuo', label: 'Poste Cônico Contínuo' },
  { value: 'teleconico',       label: 'Poste Telecônico' },
  { value: 'poligonal',        label: 'Poste Poligonal' },
  { value: 'braco',            label: 'Braço' },
  { value: 'flange',           label: 'Flange' },
  { value: 'chumbador',        label: 'Chumbadores' },
]

export interface ItemOrcamento {
  id: string
  tipoProduto: string
  descricao: string
  parametrosJson: Record<string, any>
  quantidade: number
  pesoPretoKg: number
  pesoGalvKg: number
  precoKgUsicrom: number
  precoUnitSemIpi: number
  precoTotalSemIpi: number
  aliquotaIcms: number
  pisCofins: number
  aliquotaIpi: number
  valorIpi: number
  valorSt: number
}

interface Props {
  item: ItemOrcamento
  index: number
  aliquotaIcms: number
  percRep: number
  percTecno: number
  onChange: (d: Partial<ItemOrcamento>) => void
  onRemove: () => void
}

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtKg = (v: number) => `${v.toFixed(2).replace('.', ',')} kg`
const fmtN = (v: number) => v.toFixed(2).replace('.', ',')

export function ItemOrcamentoRow({ item, index, aliquotaIcms, percRep, percTecno, onChange, onRemove }: Props) {
  const [expandido, setExpandido] = useState(true)

  const p = item.parametrosJson

  function setParam(key: string, value: any) {
    onChange({ parametrosJson: { ...item.parametrosJson, [key]: value } })
  }

  // Recalcular quando inputs mudam
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    recalcular()
  }, [
    item.tipoProduto,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(item.parametrosJson),
    item.quantidade,
    item.aliquotaIpi,
    item.valorSt,
    percRep,
    percTecno,
  ])

  function recalcular() {
    let pesoPreto = 0

    try {
      switch (item.tipoProduto) {
        case 'conico_continuo': {
          const r = calcularPoleConico({
            alturaM:          Number(p.alturaM ?? 0),
            conicidadeMmM:    Number(p.conicidadeMmM ?? 14),
            diametroTopoMm:   Number(p.diametroTopoMm ?? 76),
            espessuraParede:  Number(p.espessuraParede ?? 3),
          })
          pesoPreto = r.pesoTotalPreto
          break
        }
        case 'teleconico': {
          const secoes = (p.secoes ?? []).map((s: any) => ({
            diametroExtMm: Number(s.diametroExtMm ?? 0),
            espessuraMm:   Number(s.espessuraMm ?? 0),
            comprimentoM:  Number(s.comprimentoM ?? 0),
          })).filter((s: any) => s.diametroExtMm > 0)
          if (secoes.length > 0) {
            const r = calcularPoleTeleconico(secoes)
            pesoPreto = r.pesoTotalPreto
          }
          break
        }
        case 'poligonal': {
          const r = calcularPolePoligonal({
            alturaM:     Number(p.alturaM ?? 0),
            numLados:    Number(p.numLados ?? 8),
            sBaseMm:     Number(p.sBaseMm ?? 0),
            sTopoMm:     Number(p.sTopoMm ?? 0),
            espessuraMm: Number(p.espessuraMm ?? 3),
          })
          pesoPreto = r.pesoTotalPreto
          break
        }
        case 'braco': {
          const secoes = p.secoes ?? [{
            diametroExtMm: Number(p.diametroExtMm ?? 60),
            espessuraMm:   Number(p.espessuraMm ?? 2.65),
            comprimentoM:  Number(p.comprimentoM ?? 0),
          }]
          const r = calcularBraco({
            secoes: secoes.map((s: any) => ({
              diametroExtMm: Number(s.diametroExtMm),
              espessuraMm:   Number(s.espessuraMm),
              comprimentoM:  Number(s.comprimentoM),
            })),
            sapataLargMm:  p.sapataLargMm  ? Number(p.sapataLargMm)  : undefined,
            sapataCompMm:  p.sapataCompMm  ? Number(p.sapataCompMm)  : undefined,
            sapataEspMm:   p.sapataEspMm   ? Number(p.sapataEspMm)   : undefined,
            reforcoBMMm:   p.reforcoBMMm   ? Number(p.reforcoBMMm)   : undefined,
            reforcoAlMm:   p.reforcoAlMm   ? Number(p.reforcoAlMm)   : undefined,
            reforcoEspMm:  p.reforcoEspMm  ? Number(p.reforcoEspMm)  : undefined,
            qtdReforcos:   p.qtdReforcos   ? Number(p.qtdReforcos)   : undefined,
          })
          pesoPreto = r.pesoTotalPreto
          break
        }
        case 'flange': {
          const r = calcularFlange({
            baseLadoMm:         Number(p.baseLadoMm ?? 250),
            baseEspessuraMm:    Number(p.baseEspessuraMm ?? 12),
            baseFuroDiametroMm: Number(p.baseFuroDiametroMm ?? 120),
            lateralDiametroMm:  Number(p.lateralDiametroMm ?? 150),
            lateralEspessuraMm: Number(p.lateralEspessuraMm ?? 6),
            lateralAlturaMm:    Number(p.lateralAlturaMm ?? 80),
            triBaseMm:          Number(p.triBaseMm ?? 80),
            triAlturaMm:        Number(p.triAlturaMm ?? 60),
            triEspessuraMm:     Number(p.triEspessuraMm ?? 6),
          })
          pesoPreto = r.pesoTotalPrerto
          break
        }
        case 'chumbador': {
          const qtdJogo = Number(p.qtdPorJogo ?? 4)
          const r = calcularChumbadores({
            diametroMm:    Number(p.diametroMm ?? 25),
            comprimentoMm: Number(p.comprimentoMm ?? 800),
            quantidade:    qtdJogo,
          })
          // resultado é peso de 1 jogo (qtdPorJogo unidades)
          // item.quantidade = nº de jogos
          pesoPreto = r.pesoTotalGalv / 1.05  // inverter galv para obter preto
          break
        }
      }
    } catch {
      // parâmetros incompletos
    }

    const pesoGalv = galvanizar(pesoPreto)
    const precoKg  = PRECO_KG[item.tipoProduto] ?? 20

    const precoUnitarioUsicrom = pesoGalv * precoKg
    const { precoFinal } = calcularPrecoFinal(precoUnitarioUsicrom, percRep, percTecno)
    const precoUnitSemIpi = precoFinal
    const precoTotalSemIpi = precoFinal * item.quantidade
    const valorIpi = precoUnitSemIpi * (item.aliquotaIpi / 100)

    onChange({
      pesoPretoKg:       pesoPreto,
      pesoGalvKg:        pesoGalv,
      precoKgUsicrom:    precoKg,
      precoUnitSemIpi,
      precoTotalSemIpi,
      valorIpi,
      aliquotaIcms,
    })
  }

  return (
    <div className="border border-bg-border rounded-xl overflow-hidden">
      {/* ── Cabeçalho do item ── */}
      <div
        className="flex items-center gap-3 px-4 py-3 bg-bg-hover cursor-pointer select-none"
        onClick={() => setExpandido(!expandido)}
      >
        <span className="text-xs font-mono text-text-faint w-5">{index + 1}</span>

        <select
          className="input input-sm flex-1 max-w-[220px]"
          value={item.tipoProduto}
          onClick={e => e.stopPropagation()}
          onChange={e => onChange({ tipoProduto: e.target.value, parametrosJson: {} })}
        >
          {TIPOS_PRODUTO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>

        <input
          type="number" min="1" placeholder="Qtd"
          className="input input-sm w-20"
          value={item.quantidade}
          onClick={e => e.stopPropagation()}
          onChange={e => onChange({ quantidade: Math.max(1, Number(e.target.value) || 1) })}
        />

        {item.pesoGalvKg > 0 && (
          <span className="text-xs text-text-muted hidden md:inline">{fmtKg(item.pesoGalvKg * item.quantidade)}</span>
        )}
        {item.precoTotalSemIpi > 0 && (
          <span className="text-sm font-bold mono text-blue-glow ml-auto">{fmt(item.precoTotalSemIpi)}</span>
        )}

        <button
          type="button"
          onClick={e => { e.stopPropagation(); onRemove() }}
          className="text-red-400 hover:text-red-300 ml-1 p-1 rounded"
          title="Remover item"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <svg
          className={cn('w-4 h-4 text-text-faint transition-transform', expandido && 'rotate-180')}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* ── Parâmetros ── */}
      {expandido && (
        <div className="p-4 space-y-4">
          {/* Descrição */}
          <div>
            <label className="label">Descrição do Item</label>
            <input
              type="text" className="input input-sm"
              placeholder="Ex: Poste cônico 12m · 150 daN"
              value={item.descricao}
              onChange={e => onChange({ descricao: e.target.value })}
            />
          </div>

          {/* ── Parâmetros por tipo ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

            {item.tipoProduto === 'conico_continuo' && <>
              <F label="Altura (m)"         v={p.alturaM ?? ''}       set={v => setParam('alturaM', v)} />
              <F label="Conicidade (mm/m)"  v={p.conicidadeMmM ?? 14} set={v => setParam('conicidadeMmM', v)} />
              <F label="Ø Topo (mm)"        v={p.diametroTopoMm ?? 76} set={v => setParam('diametroTopoMm', v)} />
              <F label="Espessura parede (mm)" v={p.espessuraParede ?? 3} set={v => setParam('espessuraParede', v)} />
            </>}

            {item.tipoProduto === 'poligonal' && <>
              <F label="Altura (m)"         v={p.alturaM ?? ''}    set={v => setParam('alturaM', v)} />
              <F label="Nº Lados"           v={p.numLados ?? 8}    set={v => setParam('numLados', v)} />
              <F label="Lado Base (mm)"     v={p.sBaseMm ?? ''}    set={v => setParam('sBaseMm', v)} />
              <F label="Lado Topo (mm)"     v={p.sTopoMm ?? ''}    set={v => setParam('sTopoMm', v)} />
              <F label="Espessura (mm)"     v={p.espessuraMm ?? 3} set={v => setParam('espessuraMm', v)} className="md:col-span-2" />
            </>}

            {item.tipoProduto === 'braco' && <>
              <F label="Comprimento (m)"    v={p.comprimentoM ?? ''}  set={v => setParam('comprimentoM', v)} />
              <F label="Ø Externo (mm)"     v={p.diametroExtMm ?? 60} set={v => setParam('diametroExtMm', v)} />
              <F label="Espessura (mm)"     v={p.espessuraMm ?? 2.65} set={v => setParam('espessuraMm', v)} />
              {/* Sapata */}
              <div className="col-span-2 md:col-span-4">
                <p className="text-xs text-text-faint mb-2">Sapata (opcional)</p>
                <div className="grid grid-cols-3 gap-3">
                  <F label="Larg. (mm)" v={p.sapataLargMm ?? ''} set={v => setParam('sapataLargMm', v)} />
                  <F label="Comp. (mm)" v={p.sapataCompMm ?? ''} set={v => setParam('sapataCompMm', v)} />
                  <F label="Esp. (mm)"  v={p.sapataEspMm  ?? ''} set={v => setParam('sapataEspMm',  v)} />
                </div>
              </div>
              {/* Reforços */}
              <div className="col-span-2 md:col-span-4">
                <p className="text-xs text-text-faint mb-2">Chapas de reforço (opcional)</p>
                <div className="grid grid-cols-4 gap-3">
                  <F label="Base (mm)" v={p.reforcoBMMm  ?? ''} set={v => setParam('reforcoBMMm',  v)} />
                  <F label="Alt. (mm)" v={p.reforcoAlMm  ?? ''} set={v => setParam('reforcoAlMm',  v)} />
                  <F label="Esp. (mm)" v={p.reforcoEspMm ?? ''} set={v => setParam('reforcoEspMm', v)} />
                  <F label="Qtd"       v={p.qtdReforcos  ?? 2}  set={v => setParam('qtdReforcos',  v)} />
                </div>
              </div>
            </>}

            {item.tipoProduto === 'flange' && <>
              <div className="col-span-2 md:col-span-4">
                <p className="text-xs text-text-faint mb-2 font-medium">Chapa base</p>
                <div className="grid grid-cols-3 gap-3">
                  <F label="Lado (mm)"  v={p.baseLadoMm         ?? 250} set={v => setParam('baseLadoMm',         v)} />
                  <F label="Esp. (mm)"  v={p.baseEspessuraMm    ?? 12}  set={v => setParam('baseEspessuraMm',    v)} />
                  <F label="Ø Furo (mm)" v={p.baseFuroDiametroMm ?? 120} set={v => setParam('baseFuroDiametroMm', v)} />
                </div>
              </div>
              <div className="col-span-2 md:col-span-4">
                <p className="text-xs text-text-faint mb-2 font-medium">Chapa lateral</p>
                <div className="grid grid-cols-3 gap-3">
                  <F label="Ø (mm)"    v={p.lateralDiametroMm  ?? 150} set={v => setParam('lateralDiametroMm',  v)} />
                  <F label="Esp. (mm)" v={p.lateralEspessuraMm ?? 6}   set={v => setParam('lateralEspessuraMm', v)} />
                  <F label="Alt. (mm)" v={p.lateralAlturaMm    ?? 80}  set={v => setParam('lateralAlturaMm',    v)} />
                </div>
              </div>
              <div className="col-span-2 md:col-span-4">
                <p className="text-xs text-text-faint mb-2 font-medium">Triângulos de reforço (3 peças)</p>
                <div className="grid grid-cols-3 gap-3">
                  <F label="Base (mm)" v={p.triBaseMm     ?? 80} set={v => setParam('triBaseMm',     v)} />
                  <F label="Alt. (mm)" v={p.triAlturaMm   ?? 60} set={v => setParam('triAlturaMm',   v)} />
                  <F label="Esp. (mm)" v={p.triEspessuraMm ?? 6} set={v => setParam('triEspessuraMm', v)} />
                </div>
              </div>
            </>}

            {item.tipoProduto === 'chumbador' && <>
              <F label="Ø Chumbador (mm)"  v={p.diametroMm    ?? 25}  set={v => setParam('diametroMm',    v)} />
              <F label="Comprimento (mm)"  v={p.comprimentoMm ?? 800} set={v => setParam('comprimentoMm', v)} />
              <F label="Qtd por Jogo"      v={p.qtdPorJogo    ?? 4}   set={v => setParam('qtdPorJogo',    v)} />
            </>}

            {item.tipoProduto === 'teleconico' && (
              <div className="col-span-2 md:col-span-4">
                <label className="label">Seções — uma por linha: DiamExtMm ; EspessMm ; CompriM</label>
                <textarea
                  className="input input-sm font-mono"
                  rows={4}
                  placeholder={'150;3;6\n120;3;6\n100;2.65;6'}
                  value={(p.secoes ?? []).map((s: any) => `${s.diametroExtMm};${s.espessuraMm};${s.comprimentoM}`).join('\n')}
                  onChange={e => {
                    const secoes = e.target.value.split('\n')
                      .filter(l => l.trim())
                      .map(l => {
                        const [de, esp, comp] = l.split(';')
                        return { diametroExtMm: Number(de), espessuraMm: Number(esp), comprimentoM: Number(comp) }
                      })
                    setParam('secoes', secoes)
                  }}
                />
              </div>
            )}
          </div>

          {/* ── Impostos ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-bg-border">
            <div className="col-span-2 md:col-span-4">
              <span className="text-xs text-text-faint uppercase tracking-wide font-medium">Impostos e taxas</span>
            </div>
            <div>
              <label className="label">ICMS</label>
              <div className="input input-sm bg-bg text-text-muted cursor-default select-none">{aliquotaIcms}%</div>
            </div>
            <div>
              <label className="label">PIS+COFINS</label>
              <div className="input input-sm bg-bg text-text-muted cursor-default select-none">{item.pisCofins}%</div>
            </div>
            <div>
              <label className="label">IPI (%)</label>
              <input
                type="number" step="0.1" min="0" className="input input-sm"
                value={item.aliquotaIpi}
                onChange={e => onChange({ aliquotaIpi: Number(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="label">Valor ST (R$)</label>
              <input
                type="number" step="0.01" min="0" className="input input-sm"
                value={item.valorSt}
                onChange={e => onChange({ valorSt: Number(e.target.value) || 0 })}
              />
            </div>
          </div>

          {/* ── Resultado ── */}
          {item.pesoGalvKg > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-3 border-t border-bg-border bg-bg-hover -mx-4 -mb-4 px-4 py-3 text-sm">
              <div>
                <div className="label">Peso Preto</div>
                <div className="mono">{fmtKg(item.pesoPretoKg)}</div>
              </div>
              <div>
                <div className="label">Peso Galv. (unit.)</div>
                <div className="mono">{fmtKg(item.pesoGalvKg)}</div>
              </div>
              <div>
                <div className="label">R$/kg Usicrom</div>
                <div className="mono">R$ {fmtN(item.precoKgUsicrom)}</div>
              </div>
              <div>
                <div className="label">Unit. s/ IPI</div>
                <div className="mono font-semibold">{fmt(item.precoUnitSemIpi)}</div>
              </div>
              <div>
                <div className="label">Total ({item.quantidade}× + IPI)</div>
                <div className="mono font-bold text-blue-glow">
                  {fmt(item.precoTotalSemIpi + (item.valorIpi * item.quantidade) + (item.valorSt * item.quantidade))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Campo numérico genérico
function F({
  label, v, set, className = '',
}: { label: string; v: any; set: (val: string) => void; className?: string }) {
  return (
    <div className={className}>
      {label && <label className="label">{label}</label>}
      <input
        type="number" step="any" className="input input-sm"
        value={v}
        onChange={e => set(e.target.value)}
      />
    </div>
  )
}

export default ItemOrcamentoRow
