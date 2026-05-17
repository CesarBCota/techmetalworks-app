// ============================================================
// MOTOR DE CÁLCULO USICROM — FÓRMULAS EXATAS DA TABELA
// ============================================================
// Origem: Tabela Orçamentária USICROM.xlsx
// Densidade do aço: 7850 kg/m³
// Galvanização: peso_preto × 1,05
// ============================================================

const DENSIDADE_ACO = 7850 // kg/m³

// R$/kg por tipo de produto (aba CUSTOS)
export const PRECO_KG: Record<string, number> = {
  conico_continuo:       20,
  teleconico:            20,
  poligonal:             20,
  braco:                 16,
  janela_inspecao:       19,
  chumbador:             19,
  pintura_m2:            19,
  flange:                18,
  suporte_22:            27,
}

export function galvanizar(pesoPreto: number): number {
  return pesoPreto * 1.05
}

// ============================================================
// 1. DIÂMETRO DA BASE — fórmula universal (aba CÁLCULO)
// øB = (h × CN) + øT
// h  = altura em metros
// CN = conicidade em mm/m
// øT = diâmetro do topo em mm
// ============================================================
export function calcularDiametroBase(
  alturaM: number,
  conicidadeMmM: number,
  diametroTopoMm: number
): number {
  return alturaM * conicidadeMmM + diametroTopoMm
}

// ============================================================
// 2. POSTE CÔNICO CONTÍNUO (abas CC RETO, CC CS, CC CD)
//    Inclui: reto engastado, reto flangeado, curvo simples, curvo duplo
// ============================================================
export interface ParamsConico {
  alturaM: number           // altura total do poste em metros
  diametroTopoMm: number    // diâmetro do topo em mm
  conicidadeMmM: number     // conicidade em mm/m
  espessuraParede: number   // espessura da parede em mm
  // Ponteira (cano superior fino)
  temPonteira?: boolean
  ponteiraDiametroExt?: number  // mm
  ponteiraEspessura?: number    // mm
  ponteiraComprimento?: number  // m
  // Curva (para CS e CD)
  temCurva?: boolean
  curvaKg?: number          // peso da curva em kg (do catálogo)
}

export interface ResultadoConico {
  diametroBaseMm: number
  pesoColunaPreto: number
  pesoPonteiraPreto: number
  pesoCurvaPreto: number
  pesoTotalPreto: number
  pesoTotalGalv: number
  precoUsicrom: number
}

export function calcularPoleConico(p: ParamsConico): ResultadoConico {
  const diametroBaseMm = calcularDiametroBase(p.alturaM, p.conicidadeMmM, p.diametroTopoMm)

  // Peso da coluna cônica
  // Tubo cônico: peso = π × D_médio/1000 × espessura/1000 × altura × 7850
  const dMedioMm = (diametroBaseMm + p.diametroTopoMm) / 2
  const pesoColunaPreto = Math.PI * (dMedioMm / 1000) * (p.espessuraParede / 1000) * p.alturaM * DENSIDADE_ACO

  // Peso da ponteira (tubo cilíndrico)
  let pesoPonteiraPreto = 0
  if (p.temPonteira && p.ponteiraDiametroExt && p.ponteiraEspessura && p.ponteiraComprimento) {
    pesoPonteiraPreto = Math.PI *
      (p.ponteiraDiametroExt / 1000) *
      (p.ponteiraEspessura / 1000) *
      p.ponteiraComprimento * DENSIDADE_ACO
  }

  // Curva (para postes curvo simples e duplo)
  const pesoCurvaPreto = p.temCurva && p.curvaKg ? p.curvaKg : 0

  const pesoTotalPreto = pesoColunaPreto + pesoPonteiraPreto + pesoCurvaPreto
  const pesoTotalGalv  = galvanizar(pesoTotalPreto)
  const precoUsicrom   = pesoTotalGalv * PRECO_KG.conico_continuo

  return {
    diametroBaseMm,
    pesoColunaPreto,
    pesoPonteiraPreto,
    pesoCurvaPreto,
    pesoTotalPreto,
    pesoTotalGalv,
    precoUsicrom,
  }
}

// ============================================================
// 3. FLANGE (aba FLANGES)
//    3 componentes: chapa base + chapa lateral + triângulos
// ============================================================
export interface ParamsFlange {
  // Chapa base (quadrada com furo circular)
  baseLadoMm: number         // lado do quadrado em mm
  baseEspessuraMm: number    // espessura em mm
  baseFuroDiametroMm: number // diâmetro do furo central em mm
  // Chapa lateral (anel/cilindro)
  lateralDiametroMm: number  // diâmetro médio em mm
  lateralEspessuraMm: number // espessura em mm
  lateralAlturaMm: number    // altura em mm
  // Triângulos de reforço (3 peças)
  triBaseMm: number          // base do triângulo em mm
  triAlturaMm: number        // altura do triângulo em mm
  triEspessuraMm: number     // espessura em mm
}

export interface ResultadoFlange {
  pesoBasePreto: number
  pesoLateralPrerto: number
  pesoTriangulosPreto: number
  pesoTotalPrerto: number
  pesoTotalGalv: number
  precoUsicrom: number
}

export function calcularFlange(p: ParamsFlange): ResultadoFlange {
  const m3tom = (mm: number) => mm / 1000

  // Chapa base: quadrado - furo circular
  const areaBaseTotal    = m3tom(p.baseLadoMm) ** 2
  const areaFuro         = Math.PI * (m3tom(p.baseFuroDiametroMm) / 2) ** 2
  const areaBase         = areaBaseTotal - areaFuro
  const pesoBasePreto    = areaBase * m3tom(p.baseEspessuraMm) * DENSIDADE_ACO

  // Chapa lateral (anel cilíndrico)
  const pesoLateralPrerto = Math.PI *
    m3tom(p.lateralDiametroMm) *
    m3tom(p.lateralEspessuraMm) *
    m3tom(p.lateralAlturaMm) *
    DENSIDADE_ACO

  // 3 triângulos de reforço
  const areaTriangulo       = (m3tom(p.triBaseMm) * m3tom(p.triAlturaMm)) / 2
  const pesoTriangulosPreto = areaTriangulo * m3tom(p.triEspessuraMm) * DENSIDADE_ACO * 3

  const pesoTotalPrerto = pesoBasePreto + pesoLateralPrerto + pesoTriangulosPreto
  const pesoTotalGalv   = galvanizar(pesoTotalPrerto)
  const precoUsicrom    = pesoTotalGalv * PRECO_KG.flange

  return { pesoBasePreto, pesoLateralPrerto, pesoTriangulosPreto, pesoTotalPrerto, pesoTotalGalv, precoUsicrom }
}

// ============================================================
// 4. POSTE TELECÔNICO (aba TELECONICO)
//    Até 6 seções cilíndricas empilhadas
// ============================================================
export interface SecaoTeleconico {
  diametroExtMm: number   // diâmetro externo em mm
  espessuraMm: number     // espessura da parede em mm
  comprimentoM: number    // comprimento da seção em metros
}

export interface ResultadoTeleconico {
  pesosPorSecao: number[]
  pesoTotalPreto: number
  pesoTotalGalv: number
  precoUsicrom: number
}

export function calcularPoleTeleconico(secoes: SecaoTeleconico[]): ResultadoTeleconico {
  const pesosPorSecao = secoes.map((s) => {
    // Tubo cilíndrico: peso = (π/4) × (D_ext² - D_int²) / 1.000.000 × comprimento × 7850
    const dInt  = s.diametroExtMm - 2 * s.espessuraMm
    const area  = (Math.PI / 4) * (s.diametroExtMm ** 2 - dInt ** 2) / 1_000_000 // m²
    return area * s.comprimentoM * DENSIDADE_ACO
  })

  const pesoTotalPreto = pesosPorSecao.reduce((a, b) => a + b, 0)
  const pesoTotalGalv  = galvanizar(pesoTotalPreto)
  const precoUsicrom   = pesoTotalGalv * PRECO_KG.teleconico

  return { pesosPorSecao, pesoTotalPreto, pesoTotalGalv, precoUsicrom }
}

// ============================================================
// 5. POSTE POLIGONAL (aba POLOGONAIS)
//    Seção poligonal regular (normalmente octogonal - 8 lados)
// ============================================================
export interface ParamsPoligonal {
  alturaM: number         // altura total em metros
  sBaseMm: number         // comprimento do lado na base (mm)
  sTopoMm: number         // comprimento do lado no topo (mm)
  espessuraMm: number     // espessura da chapa (mm)
  numLados?: number       // número de lados (padrão: 8 = octogonal)
}

export interface ResultadoPoligonal {
  perimetroBaseMm: number
  perimetroTopoMm: number
  pesoTotalPreto: number
  pesoTotalGalv: number
  precoUsicrom: number
}

export function calcularPolePoligonal(p: ParamsPoligonal): ResultadoPoligonal {
  const nLados = p.numLados ?? 8

  const perimetroBaseMm = nLados * p.sBaseMm
  const perimetroTopoMm = nLados * p.sTopoMm
  const perimetroMedioMm = (perimetroBaseMm + perimetroTopoMm) / 2

  // Peso: perímetro médio × espessura × altura × densidade
  const pesoTotalPreto = (perimetroMedioMm / 1000) * (p.espessuraMm / 1000) * p.alturaM * DENSIDADE_ACO
  const pesoTotalGalv  = galvanizar(pesoTotalPreto)
  const precoUsicrom   = pesoTotalGalv * PRECO_KG.poligonal

  return { perimetroBaseMm, perimetroTopoMm, pesoTotalPreto, pesoTotalGalv, precoUsicrom }
}

// ============================================================
// 6. BRAÇOS (aba BR SUP)
//    Componentes: tubo principal + sapata + chapa de reforço
//    Preço = peso_galv × R$16/kg
// ============================================================
export interface SecaoBraco {
  diametroExtMm: number
  espessuraMm: number
  comprimentoM: number
}

export interface ParamsBraco {
  secoes: SecaoBraco[]
  // Sapata (chapa base de fixação)
  sapataLargMm?: number
  sapataCompMm?: number
  sapataEspMm?: number
  // Chapa de reforço
  reforcoBMMm?: number   // base
  reforcoAlMm?: number   // altura
  reforcoEspMm?: number
  qtdReforcos?: number   // quantidade de chapas de reforço
}

export interface ResultadoBraco {
  pesoTubosPreto: number
  pesoSapataPreto: number
  pesoReforcoPreto: number
  pesoTotalPreto: number
  pesoTotalGalv: number
  precoUsicrom: number
}

export function calcularBraco(p: ParamsBraco): ResultadoBraco {
  // Tubos
  const pesoTubosPreto = p.secoes.reduce((acc, s) => {
    const dInt = s.diametroExtMm - 2 * s.espessuraMm
    const area = (Math.PI / 4) * (s.diametroExtMm ** 2 - dInt ** 2) / 1_000_000
    return acc + area * s.comprimentoM * DENSIDADE_ACO
  }, 0)

  // Sapata
  let pesoSapataPreto = 0
  if (p.sapataLargMm && p.sapataCompMm && p.sapataEspMm) {
    pesoSapataPreto = (p.sapataLargMm / 1000) * (p.sapataCompMm / 1000) * (p.sapataEspMm / 1000) * DENSIDADE_ACO
  }

  // Chapas de reforço
  let pesoReforcoPreto = 0
  const qtd = p.qtdReforcos ?? 1
  if (p.reforcoBMMm && p.reforcoAlMm && p.reforcoEspMm) {
    pesoReforcoPreto = (p.reforcoBMMm / 1000) * (p.reforcoAlMm / 1000) * (p.reforcoEspMm / 1000) * DENSIDADE_ACO * qtd
  }

  const pesoTotalPreto = pesoTubosPreto + pesoSapataPreto + pesoReforcoPreto
  const pesoTotalGalv  = galvanizar(pesoTotalPreto)
  const precoUsicrom   = pesoTotalGalv * PRECO_KG.braco

  return { pesoTubosPreto, pesoSapataPreto, pesoReforcoPreto, pesoTotalPreto, pesoTotalGalv, precoUsicrom }
}

// ============================================================
// 7. CHUMBADORES (aba CHUMBADORES)
//    Preço = peso × R$19/kg
// ============================================================
export interface ParamsChumbador {
  diametroMm: number   // diâmetro da haste em mm
  comprimentoMm: number // comprimento em mm
  quantidade: number
}

export function calcularChumbadores(p: ParamsChumbador): { pesoUnitPrerto: number; pesoTotalGalv: number; precoUsicrom: number } {
  // Haste cilíndrica maciça
  const areaSecao   = Math.PI * (p.diametroMm / 2 / 1000) ** 2 // m²
  const pesoUnitPrerto = areaSecao * (p.comprimentoMm / 1000) * DENSIDADE_ACO
  const pesoTotalPreto = pesoUnitPrerto * p.quantidade
  const pesoTotalGalv  = galvanizar(pesoTotalPreto)
  const precoUsicrom   = pesoTotalGalv * PRECO_KG.chumbador
  return { pesoUnitPrerto, pesoTotalGalv, precoUsicrom }
}

// ============================================================
// 8. CÁLCULO DE PREÇO FINAL COM COMISSÃO
//    Total fixo: 7% (split representante + Tecno Lumen)
//    Preço final = preço Usicrom × 1,07
// ============================================================
export interface ResultadoPrecoFinal {
  precoUsicrom: number
  precoFinal: number
  valorComissaoTotal: number
  valorRepresentante: number
  valorTecnoLumen: number
}

export function calcularPrecoFinal(
  precoUsicrom: number,
  percRepresentante: number, // ex: 3 ou 2.65
  percTecnoLumen: number     // ex: 4 ou 4.35
): ResultadoPrecoFinal {
  const percTotal         = percRepresentante + percTecnoLumen
  const precoFinal        = precoUsicrom * (1 + percTotal / 100)
  const valorComissaoTotal = precoFinal - precoUsicrom
  const valorRepresentante = precoFinal * (percRepresentante / 100)
  const valorTecnoLumen    = precoFinal * (percTecnoLumen / 100)

  return { precoUsicrom, precoFinal, valorComissaoTotal, valorRepresentante, valorTecnoLumen }
}

// ============================================================
// 9. CÁLCULO DE IMPOSTOS POR ITEM
// ============================================================
export interface ResultadoImpostos {
  valorIcmsEmbutido: number   // ICMS já dentro do preço
  valorPisCofinsEmb: number   // PIS+COFINS já dentro
  valorSemImpostos:  number   // preço deduzindo ICMS+PIS/COFINS
  valorSt:           number   // ST a somar
  valorIpi:          number   // IPI a somar
  valorTotal:        number   // preço final com ST+IPI
}

export function calcularImpostosPorItem(
  precoComImpostosSeIpi: number,
  aliquotaIcms: number,  // ex: 12 (%)
  pisCofins: number,     // ex: 9.25 (%)
  valorSt: number,
  aliquotaIpi: number    // ex: 0 (%)
): ResultadoImpostos {
  // Impostos "por dentro" (embutidos no preço)
  const fatorImpostos = (aliquotaIcms + pisCofins) / 100
  const valorImpostosEmb = precoComImpostosSeIpi * fatorImpostos
  const valorIcmsEmbutido = precoComImpostosSeIpi * (aliquotaIcms / 100)
  const valorPisCofinsEmb = precoComImpostosSeIpi * (pisCofins / 100)
  const valorSemImpostos  = precoComImpostosSeIpi - valorImpostosEmb
  const valorIpi          = precoComImpostosSeIpi * (aliquotaIpi / 100)
  const valorTotal        = precoComImpostosSeIpi + valorSt + valorIpi

  return { valorIcmsEmbutido, valorPisCofinsEmb, valorSemImpostos, valorSt, valorIpi, valorTotal }
}

export default {
  PRECO_KG,
  calcularDiametroBase,
  calcularPoleConico,
  calcularFlange,
  calcularPoleTeleconico,
  calcularPolePoligonal,
  calcularBraco,
  calcularChumbadores,
  calcularPrecoFinal,
  calcularImpostosPorItem,
  galvanizar,
}
