import { useEffect, useRef } from 'react'
import type { LucideIcon } from 'lucide-react'

export interface ContextMenuAction {
  label: string
  icon: LucideIcon
  onClick: () => void
  danger?: boolean
}

interface Props {
  x: number
  y: number
  actions: ContextMenuAction[]
  onClose: () => void
}

export default function PipelineContextMenu({ x, y, actions, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const keyHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', keyHandler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', keyHandler)
    }
  }, [onClose])

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-claude-surface border border-claude-border rounded-xl shadow-2xl py-1 min-w-[160px]"
      style={{ top: y, left: x }}
    >
      {actions.map(action => {
        const Icon = action.icon
        return (
          <button
            key={action.label}
            type="button"
            onClick={() => { action.onClick(); onClose() }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left ${
              action.danger
                ? 'text-red-400 hover:bg-red-500/10'
                : 'text-claude-text hover:bg-claude-border'
            }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {action.label}
          </button>
        )
      })}
    </div>
  )
}
