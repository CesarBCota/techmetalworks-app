'use client'

interface Props {
  className?: string
  label?: string
}

export function BotaoImprimir({ className, label = '🖨️ Imprimir / Salvar PDF' }: Props) {
  return (
    <button className={className} onClick={() => window.print()}>
      {label}
    </button>
  )
}

export default BotaoImprimir
