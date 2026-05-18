import { PrismaClient } from '@prisma/client'
import * as XLSX from 'xlsx'
import * as path from 'path'

const db = new PrismaClient()

// Converte número serial do Excel para Date UTC
// Fórmula: (serial - 25569) dias desde epoch Unix (1970-01-01)
function excelSerialToDate(serial: number): Date {
  return new Date((serial - 25569) * 86400 * 1000)
}

function toFloat(val: unknown): number {
  if (typeof val === 'number') return val
  if (typeof val === 'string') {
    const n = parseFloat(val.replace(',', '.').replace(/[^\d.-]/g, ''))
    return isNaN(n) ? 0 : n
  }
  return 0
}

function str(val: unknown): string {
  if (val === null || val === undefined) return ''
  return String(val).trim()
}

async function main() {
  const filePath = path.join(__dirname, 'Fluxo_de_Caixa_TECNO.xlsx')
  console.log(`📂 Lendo planilha: ${filePath}\n`)

  const workbook = XLSX.readFile(filePath)

  let totalReceitas = 0
  let totalDespesas = 0
  let ignorados = 0

  // ── ABA RECEITAS ─────────────────────────────────────────────────────────────
  // Estrutura da aba:
  //   Linha 0 (índice): vazia (células em branco)
  //   Linha 1 (índice): título " RECEITAS / ENTRADAS DE DINHEIRO"
  //   Linha 2 (índice): cabeçalhos reais → "Valor R$", "Origem da Receita", etc.
  //   Linha 3+ (índice): dados
  // range: 2 → pula linhas 0 e 1, usa linha 2 como header

  const wsReceitas = workbook.Sheets['Receitas']
  if (!wsReceitas) { console.error('❌ Aba "Receitas" não encontrada.'); process.exit(1) }

  const receitas = XLSX.utils.sheet_to_json<Record<string, unknown>>(wsReceitas, {
    range: 3,
    defval: null,
  })

  console.log(`📊 Receitas — ${receitas.length} linhas após cabeçalho`)

  for (const row of receitas) {
    const valor     = toFloat(row['Valor R$'])
    const descricao = str(row['Origem da Receita'])
    const conta     = str(row['Recebido em '] ?? row['Recebido em'])
    const dataRaw   = row['Data']

    if (valor <= 0) { ignorados++; continue }

    let data: Date
    if (typeof dataRaw === 'number' && dataRaw > 0) {
      data = excelSerialToDate(dataRaw)
    } else {
      const mes = toFloat(row['Mês'])
      const ano = toFloat(row['Ano'])
      data = (mes && ano) ? new Date(Date.UTC(ano, mes - 1, 1)) : new Date()
    }

    try {
      await db.lancamentoCaixa.create({
        data: {
          data,
          tipo:      'receita',
          descricao: descricao || 'Receita importada',
          categoria: 'importado',
          valor,
          conta:     conta || null,
          origem:    'importado',
          criadoPor: 'importacao-xlsx',
        },
      })
      totalReceitas++
    } catch (e) {
      console.error(`  ❌ Receita "${descricao}": ${e}`)
      ignorados++
    }
  }

  console.log(`  ✅ ${totalReceitas} receitas importadas`)

  // ── ABA DESPESAS ─────────────────────────────────────────────────────────────
  // Mesma estrutura: 2 linhas antes dos cabeçalhos reais
  // range: 2 → usa linha 2 como header: "Valor R$", "Tipo de Gasto", "Detalhamento", "Retirado de", "Data"

  const wsDespesas = workbook.Sheets['Despesas']
  if (!wsDespesas) { console.error('❌ Aba "Despesas" não encontrada.'); process.exit(1) }

  const despesas = XLSX.utils.sheet_to_json<Record<string, unknown>>(wsDespesas, {
    range: 3,
    defval: null,
  })

  console.log(`\n📊 Despesas — ${despesas.length} linhas após cabeçalho`)

  for (const row of despesas) {
    const valor     = toFloat(row['Valor R$'])
    const categoria = str(row['Tipo de Gasto'])
    const descricao = str(row['Detalhamento'])
    const conta     = str(row['Retirado de'])
    const dataRaw   = row['Data']

    if (valor <= 0) { ignorados++; continue }

    let data: Date
    if (typeof dataRaw === 'number' && dataRaw > 0) {
      data = excelSerialToDate(dataRaw)
    } else {
      const mes = toFloat(row['Mês'])
      const ano = toFloat(row['Ano'])
      data = (mes && ano) ? new Date(Date.UTC(ano, mes - 1, 1)) : new Date()
    }

    try {
      await db.lancamentoCaixa.create({
        data: {
          data,
          tipo:      'despesa',
          descricao: descricao || categoria || 'Despesa importada',
          categoria: categoria || 'importado',
          valor,
          conta:     conta || null,
          origem:    'importado',
          criadoPor: 'importacao-xlsx',
        },
      })
      totalDespesas++
    } catch (e) {
      console.error(`  ❌ Despesa "${descricao}": ${e}`)
      ignorados++
    }
  }

  console.log(`  ✅ ${totalDespesas} despesas importadas`)

  // ── RESUMO ───────────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════')
  console.log(`  Receitas importadas:  ${totalReceitas}`)
  console.log(`  Despesas importadas:  ${totalDespesas}`)
  console.log(`  Total importado:      ${totalReceitas + totalDespesas}`)
  if (ignorados > 0) console.log(`  Linhas ignoradas:     ${ignorados} (vazias/sem valor)`)
  console.log('══════════════════════════════════════════')
}

main()
  .catch((e) => { console.error('❌ Erro fatal:', e); process.exit(1) })
  .finally(async () => { await db.$disconnect() })
