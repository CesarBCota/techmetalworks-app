import { STATUS_CONFIG, type StatusOrcamento } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as StatusOrcamento] ?? { label: status, color: 'text-text-muted bg-bg-hover border-bg-border' }
  return (
    <span className={cn('badge', cfg.color)}>
      {cfg.label}
    </span>
  )
}

export default StatusBadge
