import React from 'react'
import { cn } from '../../lib/utils'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
}

export const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label, description, disabled }) => (
  <div className="flex items-center justify-between gap-4 py-1">
    {(label || description) && (
      <div>
        {label && <p className={cn('text-body font-medium text-slate-700', disabled && 'text-muted')}>{label}</p>}
        {description && <p className="text-caption text-muted mt-0.5">{description}</p>}
      </div>
    )}
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-220',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        checked ? 'bg-primary' : 'bg-slate-200',
        disabled && 'opacity-40 cursor-not-allowed',
      )}
    >
      <span className={cn(
        'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm mt-0.5 transition-transform duration-220',
        checked ? 'translate-x-4' : 'translate-x-0.5',
      )} />
    </button>
  </div>
)
