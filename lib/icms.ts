// ICMS inter-estadual — origem sempre Minas Gerais
// Fonte: legislação brasileira vigente

export type EstadoDestino = string

// Estados do Sul e Sudeste (exceto ES) que têm alíquota 12% vindo de MG
const ESTADOS_12_PERCENT = new Set(['SP', 'RJ', 'PR', 'SC', 'RS'])
// MG → MG = 18% (interno)
// MG → SP, RJ, PR, SC, RS = 12%
// MG → todos os outros = 7%

export function calcularAliquotaIcms(ufDestino: string): number {
  const uf = ufDestino.toUpperCase().trim()
  if (uf === 'MG') return 18
  if (ESTADOS_12_PERCENT.has(uf)) return 12
  return 7
}

export const ESTADOS_BRASILEIROS = [
  { sigla: 'AC', nome: 'Acre' },
  { sigla: 'AL', nome: 'Alagoas' },
  { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' },
  { sigla: 'BA', nome: 'Bahia' },
  { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' },
  { sigla: 'ES', nome: 'Espírito Santo' },
  { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' },
  { sigla: 'MT', nome: 'Mato Grosso' },
  { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' },
  { sigla: 'PA', nome: 'Pará' },
  { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' },
  { sigla: 'PE', nome: 'Pernambuco' },
  { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' },
  { sigla: 'RN', nome: 'Rio Grande do Norte' },
  { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' },
  { sigla: 'RR', nome: 'Roraima' },
  { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' },
  { sigla: 'SE', nome: 'Sergipe' },
  { sigla: 'TO', nome: 'Tocantins' },
]

export function getAliquotaLabel(uf: string): string {
  const aliq = calcularAliquotaIcms(uf)
  return `ICMS ${aliq}% (MG → ${uf.toUpperCase()})`
}
