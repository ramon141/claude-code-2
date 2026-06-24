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
                  done && 'bg-[#D97757] text-white',
                  active && 'bg-[#D97757]/20 text-[#D97757] border border-[#D97757]',
                  !done && !active && 'bg-[#2A2A2A] text-[#6A6A6A] border border-[#3A3A3A]',
                )}
              >
                {done ? <Check className="w-3.5 h-3.5" /> : index + 1}
              </span>
              <span className={cn('text-xs', active ? 'text-[#F5F5F5]' : 'text-[#9A9A9A]')}>{label}</span>
            </div>
            {index < labels.length - 1 && <div className="flex-1 h-px bg-[#3A3A3A]" />}
          </React.Fragment>
        )
      })}
    </div>
  )
}

export default Stepper
