import { cn } from '../../lib/utils'

interface ProgressProps {
  value: number
  className?: string
}

export function Progress({ value, className }: ProgressProps) {
  const pct = Math.min(Math.max(value, 0), 100)
  const barColor =
    pct >= 90 ? 'bg-red-500' :
    pct >= 70 ? 'bg-yellow-500' :
    'bg-emerald-500'

  return (
    <div className={cn('w-full h-1.5 rounded-full bg-[#3A3A3A]', className)}>
      <div
        className={cn('h-1.5 rounded-full transition-all', barColor)}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
