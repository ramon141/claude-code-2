import React from 'react'
import { cn } from '../../lib/utils'

interface FormSectionProps {
  icon: React.ReactNode
  title: string
  description?: string
  cols?: 2 | 3
  children: React.ReactNode
  className?: string
}

export default function FormSection({ icon, title, description, cols = 2, children, className }: FormSectionProps) {
  return (
    <div className={cn('py-5 border-b border-border last:border-0 last:pb-0', className)}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-primary flex-shrink-0">{icon}</span>
        <h2 className="text-subhead text-slate-800">{title}</h2>
      </div>

      {description && (
        <p className="text-body text-muted mb-4">{description}</p>
      )}

      <div className={cn(
        'grid grid-cols-1 gap-4 mt-4',
        cols === 2 && 'sm:grid-cols-2',
        cols === 3 && 'sm:grid-cols-3',
      )}>
        {children}
      </div>
    </div>
  )
}
