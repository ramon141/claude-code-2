import { cn } from '../../../lib/utils'
import type { LayoutType } from '../types/layout'

interface Props {
  layout: LayoutType
  onChange: (layout: LayoutType) => void
}

interface LayoutOption {
  type: LayoutType
  label: string
  icon: React.ReactNode
}

function IconSingle() {
  return <div className="w-8 h-5 bg-current rounded-sm opacity-80" />
}

function IconSideBySide() {
  return (
    <div className="flex gap-0.5 w-8 h-5">
      <div className="flex-1 bg-current rounded-sm opacity-80" />
      <div className="flex-1 bg-current rounded-sm opacity-80" />
    </div>
  )
}

function IconTopBottom() {
  return (
    <div className="flex flex-col gap-0.5 w-8 h-5">
      <div className="flex-1 bg-current rounded-sm opacity-80" />
      <div className="flex-1 bg-current rounded-sm opacity-80" />
    </div>
  )
}

function IconThree() {
  return (
    <div className="flex flex-col gap-0.5 w-8 h-5">
      <div className="flex gap-0.5 flex-1">
        <div className="flex-1 bg-current rounded-sm opacity-80" />
        <div className="flex-1 bg-current rounded-sm opacity-80" />
      </div>
      <div className="flex-1 bg-current rounded-sm opacity-80" />
    </div>
  )
}

function IconFour() {
  return (
    <div className="flex flex-col gap-0.5 w-8 h-5">
      <div className="flex gap-0.5 flex-1">
        <div className="flex-1 bg-current rounded-sm opacity-80" />
        <div className="flex-1 bg-current rounded-sm opacity-80" />
      </div>
      <div className="flex gap-0.5 flex-1">
        <div className="flex-1 bg-current rounded-sm opacity-80" />
        <div className="flex-1 bg-current rounded-sm opacity-80" />
      </div>
    </div>
  )
}

const LAYOUT_OPTIONS: LayoutOption[] = [
  { type: 'single', label: '1 janela', icon: <IconSingle /> },
  { type: 'side-by-side', label: '2 lado a lado', icon: <IconSideBySide /> },
  { type: 'top-bottom', label: '2 vertical', icon: <IconTopBottom /> },
  { type: 'three', label: '3 janelas', icon: <IconThree /> },
  { type: 'four', label: '4 janelas', icon: <IconFour /> },
]

export default function LayoutPicker({ layout, onChange }: Props) {
  return (
    <div className="flex items-center gap-1 px-3 py-1.5 border-b border-claude-border bg-claude-surface flex-shrink-0">
      <span className="text-xs text-claude-muted mr-2">Layout:</span>
      {LAYOUT_OPTIONS.map(opt => (
        <button
          key={opt.type}
          type="button"
          title={opt.label}
          onClick={() => onChange(opt.type)}
          className={cn(
            'p-1.5 rounded-lg transition-colors',
            layout === opt.type
              ? 'text-claude-primary bg-claude-primary/15'
              : 'text-claude-muted hover:text-claude-text hover:bg-white/6',
          )}
        >
          {opt.icon}
        </button>
      ))}
    </div>
  )
}
