// Módulo de cálculo — TIMBRO / Zinco
// Fórmula: $ final = (LME + prêmio + acréscimo) × (1 + impostos + despachante)
// R$ final = $ final × câmbio

export type FonteTimbro = 'lingote_al' | 'nexa' | 'cvt_europa' | 'cvt_mexico_es'

export interface ConfigFonte {
  label: string
  percImpostos: number   // percentual de impostos (ex: 15.75)
  percDespachante: number // percentual do despachante (1% padrão)
}

export const FONTES_TIMBRO: Record<FonteTimbro, ConfigFonte> = {
  lingote_al: {
    label: 'Lingote A.L.',
    percImpostos: 15.75,
    percDespachante: 1,
  },
  nexa: {
    label: 'NEXA',
    percImpostos: 23.75,
    percDespachante: 1,
  },
  cvt_europa: {
    label: 'CVT Europa',
    percImpostos: 22.95,
    percDespachante: 1,
  },
  cvt_mexico_es: {
    label: 'CVT México / ES',
    percImpostos: 18.95,
    percDespachante: 1,
  },
}

export interface ParamsTimbro {
  fonte: FonteTimbro
  lmeUsdTon: number        // LME em USD/ton
  premioUsdTon: number     // prêmio em USD/ton
  acrescimoUsdTon: number  // comissão fixa em USD/ton (ex: 30, 50)
  cambioDolar: number      // R$/USD (ex: 5.10)
  quantidadeTon: number    // quantidade em toneladas
}

export interface ResultadoTimbro {
  // Inputs
  fonte: FonteTimbro
  lmeUsdTon: number
  premioUsdTon: number
  acrescimoUsdTon: number
  cambioDolar: number
  quantidadeTon: number

  // Taxas aplicadas
  percImpostos: number
  percDespachante: number
  percTotalEncargos: number // impostos + despachante

  // Cálculo por tonelada
  baseUsdTon: number       // LME + prêmio + acréscimo
  fatorEncargos: number    // (1 + percTotalEncargos/100)
  precoFinalUsdTon: number // baseUsdTon × fatorEncargos
  precoFinalBrlTon: number // precoFinalUsdTon × câmbio

  // Totais
  valorTotalUsd: number    // precoFinalUsdTon × qtd
  valorTotalBrl: number    // precoFinalBrlTon × qtd

  // Comissão (acréscimo)
  valorAcrescimoUsd: number  // acrescimoUsdTon × qtd (antes encargos)
  valorAcrescimoBrl: number  // em R$ após câmbio
}

export function calcularTimbro(p: ParamsTimbro): ResultadoTimbro {
  const config = FONTES_TIMBRO[p.fonte]
  const percTotalEncargos = config.percImpostos + config.percDespachante

  const baseUsdTon = p.lmeUsdTon + p.premioUsdTon + p.acrescimoUsdTon
  const fatorEncargos = 1 + percTotalEncargos / 100
  const precoFinalUsdTon = baseUsdTon * fatorEncargos
  const precoFinalBrlTon = precoFinalUsdTon * p.cambioDolar

  const valorTotalUsd = precoFinalUsdTon * p.quantidadeTon
  const valorTotalBrl = precoFinalBrlTon * p.quantidadeTon

  // Acréscimo bruto (antes dos encargos, por referência)
  const valorAcrescimoUsd = p.acrescimoUsdTon * p.quantidadeTon
  const valorAcrescimoBrl = valorAcrescimoUsd * p.cambioDolar

  return {
    fonte: p.fonte,
    lmeUsdTon: p.lmeUsdTon,
    premioUsdTon: p.premioUsdTon,
    acrescimoUsdTon: p.acrescimoUsdTon,
    cambioDolar: p.cambioDolar,
    quantidadeTon: p.quantidadeTon,
    percImpostos: config.percImpostos,
    percDespachante: config.percDespachante,
    percTotalEncargos,
    baseUsdTon,
    fatorEncargos,
    precoFinalUsdTon,
    precoFinalBrlTon,
    valorTotalUsd,
    valorTotalBrl,
    valorAcrescimoUsd,
    valorAcrescimoBrl,
  }
}

// Retroage o acréscimo em R$ com encargos (como aparece no custo total)
export function acrescimoComEncargos(acrescimoUsdTon: number, percTotalEncargos: number, cambioDolar: number, qtd: number): number {
  return acrescimoUsdTon * (1 + percTotalEncargos / 100) * cambioDolar * qtd
}
