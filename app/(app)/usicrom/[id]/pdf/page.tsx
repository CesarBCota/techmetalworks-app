import { notFound } from 'next/navigation'
import { db as prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { BotaoImprimir } from '@/components/ui/BotaoImprimir'

export const dynamic = 'force-dynamic'

// Inline formatters — no dependency on @/lib/utils
const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
const fmtKg = (v: number) =>
  new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(v) + ' kg'
const fmtData = (d: Date) =>
  new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

interface Props {
  params: { id: string }
}

export default async function PdfOrcamentoUsicomPage({ params }: Props) {
  await requireAuth()

  const orc = await prisma.orcamentoUsicrom.findUnique({
    where: { id: params.id },
    include: {
      cliente: true,
      representante: true,
      itens: { orderBy: { sequencia: 'asc' } },
    },
  })

  if (!orc) notFound()

  // Totais calculados a partir dos itens (não estão no model diretamente)
  const totalPesoPreto = orc.itens.reduce((s, i) => s + i.pesoPretoKg * i.quantidade, 0)
  const totalPesoGalv  = orc.itens.reduce((s, i) => s + i.pesoGalvKg  * i.quantidade, 0)
  const totalQtd       = orc.itens.reduce((s, i) => s + i.quantidade, 0)

  const tipoLabel: Record<string, string> = {
    conico_continuo: 'Poste Cônico Contínuo',
    teleconico:      'Poste Telecônico',
    poligonal:       'Poste Poligonal',
    braco:           'Braço',
    janela_inspecao: 'Janela de Inspeção',
    chumbador:       'Jogo de Chumbadores',
    pintura_m2:      'Pintura (m²)',
    flange:          'Flange',
    suporte_22:      'Suporte Ø22',
  }

  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Proposta {orc.numero}</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { background: #f0f0f0; color: #1a1a1a; font-family: Arial, Helvetica, sans-serif; font-size: 10px; }
          @media print {
            body { background: white; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            .no-print { display: none !important; }
            @page { margin: 12mm 10mm; size: A4 portrait; }
          }
          .page {
            background: white;
            max-width: 210mm;
            margin: 20px auto;
            padding: 20px 24px;
            box-shadow: 0 2px 20px rgba(0,0,0,0.15);
          }
          @media print { .page { margin: 0; box-shadow: none; padding: 0; } }

          /* Header */
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1e3a5f; padding-bottom: 14px; margin-bottom: 18px; }
          .logo h1 { font-size: 24px; font-weight: 900; color: #1e3a5f; letter-spacing: -0.5px; }
          .logo p { font-size: 9px; color: #666; margin-top: 1px; }
          .logo .empresa-info { margin-top: 6px; font-size: 8.5px; color: #444; line-height: 1.5; }
          .doc-block { text-align: right; }
          .doc-block .label { font-size: 8px; color: #999; text-transform: uppercase; letter-spacing: 0.8px; }
          .doc-block .numero { font-size: 15px; font-weight: 800; color: #1e3a5f; margin: 2px 0; }
          .doc-block .dates { font-size: 8.5px; color: #555; line-height: 1.6; }

          /* Section */
          .sec-title { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;
            color: #1e3a5f; background: #eef3fa; padding: 4px 8px; margin-bottom: 10px;
            border-left: 3px solid #1e3a5f; }

          /* Cliente */
          .cliente-grid { display: grid; grid-template-columns: 1.3fr 1fr; gap: 20px; margin-bottom: 16px; }
          .field { margin-bottom: 6px; }
          .field label { font-size: 7.5px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 1px; }
          .field span { font-size: 10px; color: #1a1a1a; }
          .field span.large { font-size: 13px; font-weight: 700; }

          /* Items table */
          table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 9px; }
          thead tr { background: #1e3a5f; }
          th { color: white; padding: 5px 7px; text-align: left; font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; white-space: nowrap; }
          th.r { text-align: right; }
          td { padding: 5px 7px; border-bottom: 1px solid #e8edf4; vertical-align: top; }
          td.r { text-align: right; }
          tr:nth-child(even) td { background: #f8fafc; }
          .item-name { font-weight: 600; color: #111; }
          .item-detail { font-size: 8px; color: #777; margin-top: 2px; }

          /* Peso summary */
          .peso-row { display: flex; gap: 28px; padding: 6px 0 10px; font-size: 9px; color: #666; border-top: 1px solid #dde3ec; }
          .peso-row strong { color: #1a1a1a; }

          /* Totals */
          .totals-wrap { display: flex; justify-content: flex-end; margin-bottom: 18px; }
          .totals { min-width: 270px; border: 1px solid #dde3ec; border-radius: 4px; overflow: hidden; }
          .t-row { display: flex; justify-content: space-between; align-items: center; padding: 5px 12px; font-size: 9.5px; }
          .t-row + .t-row { border-top: 1px solid #eee; }
          .t-row.total { background: #1e3a5f; color: white; font-size: 12px; font-weight: 800; }
          .t-row.sub { background: #f8fafc; }
          .t-val { font-weight: 600; }

          /* Conditions */
          .cond-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 16px; }
          .cond-item label { font-size: 7.5px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 2px; }
          .cond-item span { font-size: 10px; font-weight: 600; color: #1a1a1a; }

          /* Notes */
          .notes { background: #f8fafc; border: 1px solid #dde3ec; border-radius: 4px; padding: 8px 12px; margin-bottom: 16px; font-size: 9px; color: #444; line-height: 1.6; white-space: pre-wrap; }

          /* Footer */
          .footer { border-top: 2px solid #1e3a5f; padding-top: 12px; display: flex; justify-content: space-between; align-items: flex-end; margin-top: 4px; }
          .footer-left p { font-size: 8.5px; color: #555; line-height: 1.7; }
          .footer-right { text-align: right; }
          .validity { font-size: 10px; font-weight: 700; color: #c0392b; }
          .gen { font-size: 7.5px; color: #bbb; margin-top: 4px; }

          /* Print button */
          .print-bar { position: fixed; top: 0; left: 0; right: 0; background: #1e3a5f; color: white; display: flex; align-items: center; justify-content: space-between; padding: 10px 20px; z-index: 1000; box-shadow: 0 2px 10px rgba(0,0,0,0.3); }
          .print-bar h2 { font-size: 14px; font-weight: 700; }
          .print-bar .actions { display: flex; gap: 10px; }
          .btn-print { background: white; color: #1e3a5f; border: none; padding: 8px 18px; border-radius: 5px; font-size: 13px; font-weight: 700; cursor: pointer; }
          .btn-print:hover { background: #e8f0f9; }
          .btn-back { background: transparent; color: rgba(255,255,255,0.8); border: 1px solid rgba(255,255,255,0.4); padding: 8px 14px; border-radius: 5px; font-size: 12px; cursor: pointer; text-decoration: none; }
          body { padding-top: 52px; }
          @media print { body { padding-top: 0; } .print-bar { display: none; } }
        `}</style>
      </head>
      <body>
        {/* Barra de impressão */}
        <div className="print-bar no-print">
          <h2>Proposta {orc.numero} — {orc.cliente.razaoSocial}</h2>
          <div className="actions">
            <a className="btn-back" href={`/usicrom/${orc.id}`}>← Voltar</a>
            <BotaoImprimir className="btn-print" />
          </div>
        </div>

        <div className="page">
          {/* ── CABEÇALHO ── */}
          <div className="header">
            <div className="logo">
              <h1>TECH METALWORKS</h1>
              <p>Representações Comerciais</p>
              <div className="empresa-info">
                CNPJ: XX.XXX.XXX/0001-XX &nbsp;·&nbsp; Belo Horizonte / MG<br />
                contato@techmetalworks.com.br
              </div>
            </div>
            <div className="doc-block">
              <div className="label">Proposta Comercial</div>
              <div className="numero">{orc.numero}</div>
              <div className="dates">
                Emissão: {fmtData(orc.dataEmissao)}<br />
                Validade: {fmtData(orc.dataValidade)}
              </div>
            </div>
          </div>

          {/* ── CLIENTE ── */}
          <div className="sec-title">Dados do Cliente</div>
          <div className="cliente-grid">
            <div>
              <div className="field">
                <label>Razão Social</label>
                <span className="large">{orc.cliente.razaoSocial}</span>
              </div>
              <div className="field">
                <label>CNPJ</label>
                <span>{orc.cliente.cnpj}</span>
              </div>
              {orc.cliente.inscEstadual && (
                <div className="field">
                  <label>Inscrição Estadual</label>
                  <span>{orc.cliente.inscEstadual}</span>
                </div>
              )}
              {orc.cliente.solicitante && (
                <div className="field">
                  <label>Solicitante</label>
                  <span>{orc.cliente.solicitante}</span>
                </div>
              )}
            </div>
            <div>
              {(orc.cliente.entLogradouro || orc.cliente.fatLogradouro) && (
                <div className="field">
                  <label>Endereço de Entrega</label>
                  <span>
                    {orc.cliente.entLogradouro || orc.cliente.fatLogradouro}
                    {(orc.cliente.entBairro || orc.cliente.fatBairro) &&
                      ` — ${orc.cliente.entBairro || orc.cliente.fatBairro}`}
                    <br />
                    {(orc.cliente.entCidade || orc.cliente.fatCidade) &&
                      `${orc.cliente.entCidade || orc.cliente.fatCidade}`}
                    {(orc.cliente.entUf || orc.cliente.fatUf) &&
                      ` / ${orc.cliente.entUf || orc.cliente.fatUf}`}
                    {(orc.cliente.entCep || orc.cliente.fatCep) &&
                      ` · CEP ${orc.cliente.entCep || orc.cliente.fatCep}`}
                  </span>
                </div>
              )}
              {orc.cliente.email && (
                <div className="field">
                  <label>E-mail</label>
                  <span>{orc.cliente.email}</span>
                </div>
              )}
              {orc.cliente.telefone && (
                <div className="field">
                  <label>Telefone</label>
                  <span>{orc.cliente.telefone}</span>
                </div>
              )}
            </div>
          </div>

          {/* ── ITENS ── */}
          <div className="sec-title">Itens da Proposta</div>
          <table>
            <thead>
              <tr>
                <th style={{ width: 22 }}>#</th>
                <th>Descrição</th>
                <th className="r" style={{ width: 36 }}>Qtd</th>
                <th className="r" style={{ width: 72 }}>Peso Preto</th>
                <th className="r" style={{ width: 72 }}>Peso Galv.</th>
                <th className="r" style={{ width: 80 }}>Unit. Final</th>
                <th className="r" style={{ width: 88 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {orc.itens.map((item) => {
                // parametrosJson é String no schema — precisa de JSON.parse
                let p: Record<string, unknown> = {}
                try { p = JSON.parse(item.parametrosJson) } catch { /* ignora */ }

                const det: string[] = []
                if (['conico_continuo', 'teleconico', 'poligonal'].includes(item.tipoProduto)) {
                  if (p.alturaM)        det.push(`H = ${p.alturaM} m`)
                  if (p.diametroTopoMm) det.push(`Ø topo = ${p.diametroTopoMm} mm`)
                  if (p.conicidadeMmM)  det.push(`CN = ${p.conicidadeMmM} mm/m`)
                  if (p.espessuraMm)    det.push(`e = ${p.espessuraMm} mm`)
                  if (item.tipoProduto === 'teleconico' && p.numSecoes) det.push(`${p.numSecoes} seções`)
                } else if (item.tipoProduto === 'braco') {
                  if (p.comprimentoM) det.push(`L = ${p.comprimentoM} m`)
                  if (p.diametroMm)   det.push(`Ø = ${p.diametroMm} mm`)
                  if (p.espessuraMm)  det.push(`e = ${p.espessuraMm} mm`)
                } else if (item.tipoProduto === 'flange') {
                  if (p.diametroMm)  det.push(`Ø = ${p.diametroMm} mm`)
                  if (p.espessuraMm) det.push(`e = ${p.espessuraMm} mm`)
                } else if (item.tipoProduto === 'chumbador') {
                  if (p.comprimentoMm) det.push(`L = ${p.comprimentoMm} mm`)
                  if (p.diametroMm)    det.push(`Ø = ${p.diametroMm} mm`)
                  if (p.numPecas)      det.push(`${p.numPecas} peças/jogo`)
                }

                return (
                  <tr key={item.id}>
                    <td style={{ color: '#aaa', fontWeight: 700, textAlign: 'center' }}>{item.sequencia}</td>
                    <td>
                      <div className="item-name">
                        {item.descricao || tipoLabel[item.tipoProduto] || item.tipoProduto}
                      </div>
                      {det.length > 0 && <div className="item-detail">{det.join(' · ')}</div>}
                      <div className="item-detail">
                        ICMS {item.aliquotaIcms}% · PIS/COFINS {item.pisCofins}%
                        {item.aliquotaIpi > 0 ? ` · IPI ${item.aliquotaIpi}%` : ''}
                      </div>
                    </td>
                    <td className="r">{item.quantidade}</td>
                    <td className="r">{fmtKg(item.pesoPretoKg * item.quantidade)}</td>
                    <td className="r">{fmtKg(item.pesoGalvKg  * item.quantidade)}</td>
                    <td className="r">{fmt(item.precoUnitSemIpi)}</td>
                    <td className="r" style={{ fontWeight: 700 }}>{fmt(item.precoTotalSemIpi)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <div className="peso-row">
            <span>Peso Preto Total: <strong>{fmtKg(totalPesoPreto)}</strong></span>
            <span>Peso Galvanizado Total: <strong>{fmtKg(totalPesoGalv)}</strong></span>
            <span>Total de Itens: <strong>{totalQtd} peças</strong></span>
          </div>

          {/* ── TOTAL ── */}
          <div className="totals-wrap">
            <div className="totals">
              <div className="t-row sub">
                <span>Valor USICROM (base)</span>
                <span className="t-val">{fmt(orc.valorTotalUsicrom)}</span>
              </div>
              <div className="t-row sub">
                <span>Impostos (ICMS + PIS/COFINS 9,25%)</span>
                <span className="t-val" style={{ color: '#777' }}>inclusos</span>
              </div>
              <div className="t-row total">
                <span>TOTAL DA PROPOSTA</span>
                <span className="t-val">{fmt(orc.valorTotalFinal)}</span>
              </div>
            </div>
          </div>

          {/* ── CONDIÇÕES ── */}
          <div className="sec-title">Condições Comerciais</div>
          <div className="cond-grid">
            <div className="cond-item">
              <label>Pagamento</label>
              <span>{orc.condicoesPagamento || '—'}</span>
            </div>
            <div className="cond-item">
              <label>Prazo de Entrega</label>
              <span>{orc.prazoEntrega || '—'}</span>
            </div>
            <div className="cond-item">
              <label>Frete</label>
              <span>{orc.frete || 'CIF — Incluso'}</span>
            </div>
            <div className="cond-item">
              <label>Transportadora</label>
              <span>{orc.transportadora || '—'}</span>
            </div>
            <div className="cond-item">
              <label>Validade</label>
              <span>Até {fmtData(orc.dataValidade)}</span>
            </div>
            <div className="cond-item">
              <label>Local de Entrega</label>
              <span>
                {orc.cliente.entCidade || orc.cliente.fatCidade || '—'}
                {(orc.cliente.entUf || orc.cliente.fatUf)
                  ? ` / ${orc.cliente.entUf || orc.cliente.fatUf}`
                  : ''}
              </span>
            </div>
          </div>

          {/* ── OBSERVAÇÕES ── */}
          {orc.observacao && (
            <>
              <div className="sec-title">Observações</div>
              <div className="notes">{orc.observacao}</div>
            </>
          )}

          {/* ── RODAPÉ ── */}
          <div className="footer">
            <div className="footer-left">
              <p>
                <strong>Tech Metalworks Representações Comerciais</strong><br />
                CNPJ: XX.XXX.XXX/0001-XX &nbsp;·&nbsp; Belo Horizonte — MG<br />
                {orc.representante && <>Representante responsável: {orc.representante.nome}<br /></>}
                contato@techmetalworks.com.br
              </p>
            </div>
            <div className="footer-right">
              <div className="validity">Válido até {fmtData(orc.dataValidade)}</div>
              <div className="gen">
                Documento gerado em{' '}
                {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
