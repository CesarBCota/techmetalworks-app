import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

// Formatação de moeda BRL
export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

// Formatação de moeda USD
export function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

// Formatação de número com casas decimais
export function formatNum(value: number, decimais = 2): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimais,
    maximumFractionDigits: decimais,
  }).format(value)
}

// Formatação de peso em kg
export function formatKg(value: number): string {
  return `${formatNum(value, 2)} kg`
}

// Formatação de data
export function formatData(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd/MM/yyyy', { locale: ptBR })
}

export function formatDataHora(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

// Gerar número do orçamento
// Formato: YYMMDD-CLIENTE-EMPRESA (ex: 260516-PREFMUN-USICROM)
export function gerarNumeroOrcamento(
  empresa: 'USICROM' | 'TIMBRO',
  nomeCliente: string
): string {
  const hoje = new Date()
  const data = format(hoje, 'yyMMdd')
  const clienteSlug = nomeCliente
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8)
  return `${data}-${clienteSlug}-${empresa}`
}

// Formatar CNPJ
export function formatCNPJ(cnpj: string): string {
  const nums = cnpj.replace(/\D/g, '')
  if (nums.length !== 14) return cnpj
  return nums.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

// Formatar telefone
export function formatTelefone(tel: string): string {
  const nums = tel.replace(/\D/g, '')
  if (nums.length === 11) {
    return nums.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  if (nums.length === 10) {
    return nums.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  return tel
}

// Status colors
export const STATUS_CONFIG = {
  rascunho:  { label: 'Rascunho',  color: 'text-text-muted bg-bg-hover border-bg-border' },
  enviado:   { label: 'Enviado',   color: 'text-blue-light bg-blue-deep/30 border-blue-mid' },
  aprovado:  { label: 'Aprovado',  color: 'text-green-400 bg-green-900/30 border-green-700' },
  perdido:   { label: 'Perdido',   color: 'text-red-400 bg-red-900/30 border-red-700' },
  expirado:  { label: 'Expirado',  color: 'text-amber-400 bg-amber-900/30 border-amber-700' },
} as const

export type StatusOrcamento = keyof typeof STATUS_CONFIG

// Calcular data de expiração
export function calcularExpiracao(criadoEm: Date, validadeDias: number): Date {
  const exp = new Date(criadoEm)
  exp.setDate(exp.getDate() + validadeDias)
  return exp
}

export function isExpirado(expiracao: Date): boolean {
  return new Date() > expiracao
}

// Truncar texto
export function truncate(str: string, max: number): string {
  if (str.length <= max) return str
  return str.slice(0, max) + '…'
}
