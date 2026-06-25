import React from 'react'
import { Check } from 'lucide-react'
import { cn } from '../../../lib/utils'

interface StepperProps {
  labels: string[]
  current: number
}

const Stepper: React.FC<StepperProps> = ({ labels, current }) => {
  return (
    <div className="flex items-center gap-2">
      {labels.map((label, index) => {
        const done = index < current
        const active = index === current
        return (
          <React.Fragment key={label}>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors',
                  done && 'bg-claude-primary text-white',
                  active && 'bg-claude-primary/20 text-claude-primary border border-claude-primary',
                  !done && !active && 'bg-claude-surface text-claude-muted border border-claude-border',
                )}
              >
                {done ? <Check className="w-3.5 h-3.5" /> : index + 1}
              </span>
              <span className={cn('text-xs', active ? 'text-claude-text' : 'text-claude-muted')}>{label}</span>
            </div>
            {index < labels.length - 1 && <div className="flex-1 h-px bg-claude-border" />}
          </React.Fragment>
        )
      })}
    </div>
  )
}

export default Stepper
