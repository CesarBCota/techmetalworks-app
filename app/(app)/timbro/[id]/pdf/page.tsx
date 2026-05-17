import { notFound } from 'next/navigation'
import { db as prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { FONTES_TIMBRO } from '@/lib/calculos-timbro'
import { BotaoImprimir } from '@/components/ui/BotaoImprimir'

interface Props { params: { id: string } }

const fmtBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
const fmtUSD = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)
const fmtNum = (v: number, dec = 2) =>
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(v)
const fmtData = (d: Date) =>
  new Date(d).toLocaleDateString('pt-BR')

export default async function PdfTimbroPage({ params }: Props) {
  await requireAuth()

  const orc = await prisma.orcamentoTimbro.findUnique({
    where: { id: params.id },
    include: { cliente: true },
  })
  if (!orc) notFound()

  const fonteConfig = FONTES_TIMBRO[orc.fonte as keyof typeof FONTES_TIMBRO]
  const fonteLabel = fonteConfig?.label ?? orc.fonte
  const percTotalEncargos = orc.percImpostos + orc.percDespachante

  // Client-facing price (acréscimo is embedded — not shown as line item)
  const lmeMaisPremio = orc.lmeUsdTon + orc.premioUsdTon

  const geradoEm = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Proposta Zinco {orc.numero}</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { background: #f0f0f0; color: #1a1a1a; font-family: Arial, Helvetica, sans-serif; font-size: 10px; }
          @media print {
            body { background: white; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            .no-print { display: none !important; }
            @page { margin: 14mm 12mm; size: A4 portrait; }
          }
          .page {
            background: white;
            max-width: 200mm;
            margin: 20px auto;
            padding: 24px 28px;
            box-shadow: 0 2px 20px rgba(0,0,0,0.15);
          }
          @media print { .page { margin: 0; box-shadow: none; padding: 0; } }

          /* ── Print bar ── */
          .print-bar {
            position: fixed; top: 0; left: 0; right: 0;
            background: #1e3a5f; color: white;
            display: flex; align-items: center; justify-content: space-between;
            padding: 10px 20px; z-index: 1000; box-shadow: 0 2px 10px rgba(0,0,0,0.3);
          }
          .print-bar h2 { font-size: 13px; font-weight: 700; }
          .print-bar .actions { display: flex; gap: 10px; }
          .btn-print { background: white; color: #1e3a5f; border: none; padding: 7px 16px; border-radius: 4px; font-size: 12px; font-weight: 700; cursor: pointer; }
          .btn-print:hover { background: #e8f0f9; }
          .btn-back { background: transparent; color: rgba(255,255,255,0.8); border: 1px solid rgba(255,255,255,0.4); padding: 7px 14px; border-radius: 4px; font-size: 11px; cursor: pointer; text-decoration: none; }
          body { padding-top: 52px; }
          @media print { body { padding-top: 0; } .print-bar { display: none; } }

          /* ── Header ── */
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1e3a5f; padding-bottom: 14px; margin-bottom: 20px; }
          .logo h1 { font-size: 22px; font-weight: 900; color: #1e3a5f; letter-spacing: -0.5px; }
          .logo p { font-size: 9px; color: #666; margin-top: 2px; }
          .logo .company-info { margin-top: 8px; font-size: 8.5px; color: #555; line-height: 1.6; }
          .doc-block { text-align: right; }
          .doc-block .type { font-size: 8px; color: #999; text-transform: uppercase; letter-spacing: 0.8px; }
          .doc-block .numero { font-size: 16px; font-weight: 800; color: #1e3a5f; margin: 3px 0; }
          .doc-block .dates { font-size: 8.5px; color: #555; line-height: 1.7; }

          /* ── Section title ── */
          .sec { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;
            color: #1e3a5f; background: #eef3fa; padding: 4px 8px;
            margin: 16px 0 10px; border-left: 3px solid #1e3a5f; }

          /* ── Cliente grid ── */
          .cli-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px; margin-bottom: 4px; }
          .field { margin-bottom: 7px; }
          .field label { font-size: 7.5px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 1px; }
          .field .val { font-size: 10px; color: #1a1a1a; }
          .field .val.lg { font-size: 13px; font-weight: 700; }

          /* ── Zinc product card ── */
          .zinc-card { border: 1px solid #dde3ec; border-radius: 5px; overflow: hidden; margin-bottom: 4px; }
          .zinc-head { background: #1e3a5f; color: white; padding: 8px 14px; display: flex; justify-content: space-between; align-items: center; }
          .zinc-head .prod { font-size: 13px; font-weight: 800; }
          .zinc-head .spec { font-size: 9px; opacity: 0.8; }
          .zinc-body { padding: 12px 14px; }

          /* ── Pricing table ── */
          .price-table { width: 100%; border-collapse: collapse; font-size: 9.5px; }
          .price-table tr td { padding: 5px 8px; }
          .price-table tr td:last-child { text-align: right; font-weight: 600; }
          .price-table .sub td { color: #777; border-bottom: 1px solid #f0f0f0; }
          .price-table .sub td:first-child { padding-left: 18px; font-size: 9px; }
          .price-table .main td { font-weight: 700; color: #1a1a1a; background: #f8fafc; border-top: 1px solid #dde3ec; border-bottom: 1px solid #dde3ec; }
          .price-table .final td { background: #1e3a5f; color: white; font-size: 11px; }
          .price-table .total td { background: #122a47; color: white; font-size: 14px; font-weight: 900; padding: 10px 8px; }

          /* ── Conditions grid ── */
          .cond-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
          .cond-item label { font-size: 7.5px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 2px; }
          .cond-item span { font-size: 10px; font-weight: 600; color: #1a1a1a; }

          /* ── Notes ── */
          .notes { background: #f8fafc; border: 1px solid #dde3ec; border-radius: 4px; padding: 8px 12px; font-size: 9px; color: #444; line-height: 1.6; white-space: pre-wrap; }

          /* ── Disclaimer ── */
          .disclaimer { background: #fffbea; border: 1px solid #f0d060; border-radius: 4px; padding: 8px 12px; font-size: 8px; color: #666; line-height: 1.6; }

          /* ── Footer ── */
          .footer { border-top: 2px solid #1e3a5f; padding-top: 12px; margin-top: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
          .footer-left { font-size: 8.5px; color: #555; line-height: 1.8; }
          .footer-right { text-align: right; }
          .footer-right .validity { font-size: 10px; font-weight: 700; color: #c0392b; }
          .footer-right .gen { font-size: 7.5px; color: #bbb; margin-top: 3px; }
        `}</style>
      </head>
      <body>

        {/* Barra de impressão */}
        <div className="print-bar no-print">
          <h2>Proposta Zinco {orc.numero} — {orc.cliente.razaoSocial}</h2>
          <div className="actions">
            <a className="btn-back" href={`/timbro/${orc.id}`}>← Voltar</a>
            <BotaoImprimir className="btn-print" />
          </div>
        </div>

        <div className="page">

          {/* ── CABEÇALHO ── */}
          <div className="header">
            <div className="logo">
              <h1>TECH METALWORKS</h1>
              <p>Representações Comerciais</p>
              <div className="company-info">
                CNPJ: XX.XXX.XXX/0001-XX &nbsp;·&nbsp; Belo Horizonte / MG<br />
                contato@techmetalworks.com.br
              </div>
            </div>
            <div className="doc-block">
              <div className="type">Proposta Comercial — Zinco</div>
              <div className="numero">{orc.numero}</div>
              <div className="dates">
                Emissão: {fmtData(orc.dataEmissao)}<br />
                Válido até: {fmtData(orc.dataValidade)}
              </div>
            </div>
          </div>

          {/* ── CLIENTE ── */}
          <div className="sec">Dados do Cliente</div>
          <div className="cli-grid">
            <div>
              <div className="field">
                <label>Razão Social</label>
                <span className="val lg">{orc.cliente.razaoSocial}</span>
              </div>
              <div className="field">
                <label>CNPJ</label>
                <span className="val">{orc.cliente.cnpj || '—'}</span>
              </div>
              {orc.cliente.inscEstadual && (
                <div className="field">
                  <label>Inscrição Estadual</label>
                  <span className="val">{orc.cliente.inscEstadual}</span>
                </div>
              )}
            </div>
            <div>
              {(orc.cliente.entLogradouro || orc.cliente.fatLogradouro) && (
                <div className="field">
                  <label>Endereço</label>
                  <span className="val">
                    {orc.cliente.entLogradouro || orc.cliente.fatLogradouro}
                    <br />
                    {(orc.cliente.entCidade || orc.cliente.fatCidade) &&
                      `${orc.cliente.entCidade || orc.cliente.fatCidade} / `}
                    {orc.cliente.entUf || orc.cliente.fatUf || ''}
                    {(orc.cliente.entCep || orc.cliente.fatCep) &&
                      ` · CEP ${orc.cliente.entCep || orc.cliente.fatCep}`}
                  </span>
                </div>
              )}
              {orc.cliente.email && (
                <div className="field">
                  <label>E-mail</label>
                  <span className="val">{orc.cliente.email}</span>
                </div>
              )}
              {orc.cliente.telefone && (
                <div className="field">
                  <label>Telefone</label>
                  <span className="val">{orc.cliente.telefone}</span>
                </div>
              )}
            </div>
          </div>

          {/* ── PRODUTO & PREÇO ── */}
          <div className="sec">Especificação do Produto e Precificação</div>
          <div className="zinc-card">
            <div className="zinc-head">
              <div>
                <div className="prod">ZINCO ESPECIAL GRAU Z.E. / SHG</div>
                <div className="spec">Origem: {fonteLabel} &nbsp;·&nbsp; Pureza: 99,995% mín. &nbsp;·&nbsp; Norma: ASTM B6 / EN 1179</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 9, opacity: 0.7 }}>Quantidade</div>
                <div style={{ fontSize: 14, fontWeight: 800 }}>{fmtNum(orc.quantidadeTon, 3)} ton</div>
              </div>
            </div>
            <div className="zinc-body">
              <table className="price-table">
                <tbody>
                  <tr className="sub">
                    <td>LME (London Metal Exchange)</td>
                    <td>{fmtUSD(orc.lmeUsdTon)} / ton</td>
                  </tr>
                  <tr className="sub">
                    <td>Prêmio de origem</td>
                    <td>+ {fmtUSD(orc.premioUsdTon)} / ton</td>
                  </tr>
                  <tr className="main">
                    <td>Preço base (LME + prêmio)</td>
                    <td>{fmtUSD(lmeMaisPremio)} / ton</td>
                  </tr>
                  <tr className="sub">
                    <td>Encargos importação / nacionalização ({fmtNum(percTotalEncargos)}%)</td>
                    <td>+ {fmtNum(percTotalEncargos)}%</td>
                  </tr>
                  <tr className="final">
                    <td>Preço Final USD/ton (CIF destino)</td>
                    <td>{fmtUSD(orc.precoFinalUsdTon)} / ton</td>
                  </tr>
                  <tr className="sub">
                    <td>Câmbio USD (referência)</td>
                    <td>R$ {fmtNum(orc.cambioDolar, 4)}</td>
                  </tr>
                  <tr className="main">
                    <td>Preço Final BRL/ton</td>
                    <td>{fmtBRL(orc.precoFinalBrlTon)} / ton</td>
                  </tr>
                  <tr className="sub">
                    <td>Quantidade</td>
                    <td>{fmtNum(orc.quantidadeTon, 3)} toneladas</td>
                  </tr>
                  <tr className="total">
                    <td>VALOR TOTAL DA PROPOSTA</td>
                    <td>{fmtBRL(orc.valorTotalBrl)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ── CONDIÇÕES ── */}
          <div className="sec">Condições Comerciais</div>
          <div className="cond-grid" style={{ marginBottom: 16 }}>
            <div className="cond-item">
              <label>Condição de Pagamento</label>
              <span>{orc.condicoesPagamento || '—'}</span>
            </div>
            <div className="cond-item">
              <label>Prazo de Entrega</label>
              <span>{orc.prazoEntrega || '—'}</span>
            </div>
            <div className="cond-item">
              <label>Validade da Proposta</label>
              <span>até {fmtData(orc.dataValidade)}</span>
            </div>
            <div className="cond-item">
              <label>Câmbio de Referência</label>
              <span>USD/BRL {fmtNum(orc.cambioDolar, 4)}</span>
            </div>
            <div className="cond-item">
              <label>Cotação LME Referência</label>
              <span>{fmtUSD(orc.lmeUsdTon)} / ton</span>
            </div>
            <div className="cond-item">
              <label>Origem</label>
              <span>{fonteLabel}</span>
            </div>
          </div>

          {/* ── DISCLAIMER ── */}
          <div className="disclaimer" style={{ marginBottom: 14 }}>
            <strong>Importante:</strong> Os preços acima estão vinculados às cotações do LME e câmbio indicados.
            Variações posteriores poderão ensejar reprecificação. O valor final será confirmado na emissão da nota fiscal,
            com base no câmbio e LME vigentes na data do faturamento, conforme acordado entre as partes.
          </div>

          {/* ── OBSERVAÇÕES ── */}
          {orc.observacao && (
            <>
              <div className="sec">Observações</div>
              <div className="notes" style={{ marginBottom: 16 }}>{orc.observacao}</div>
            </>
          )}

          {/* ── RODAPÉ ── */}
          <div className="footer">
            <div className="footer-left">
              <strong>Tech Metalworks Representações Comerciais</strong><br />
              CNPJ: XX.XXX.XXX/0001-XX &nbsp;·&nbsp; Belo Horizonte — MG<br />
              Representando: TIMBRO (Zinco) &nbsp;·&nbsp; contato@techmetalworks.com.br
            </div>
            <div className="footer-right">
              <div className="validity">Válido até {fmtData(orc.dataValidade)}</div>
              <div className="gen">Gerado em {geradoEm}</div>
            </div>
          </div>

        </div>
      </body>
    </html>
  )
}
