import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-lg px-2.5 py-1 text-label font-medium ring-1 ring-inset whitespace-nowrap',
  {
    variants: {
      variant: {
        success: 'bg-success-light text-success-text ring-success/20',
        warning: 'bg-warning-light text-warning-text ring-warning/20',
        info:    'bg-info-light    text-info-text    ring-info/20',
        danger:  'bg-danger-light  text-danger       ring-danger/20',
        default: 'bg-slate-100     text-slate-600    ring-slate-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge: React.FC<BadgeProps> = ({ className, variant, children, ...rest }) => (
  <span className={cn(badgeVariants({ variant }), className)} {...rest}>
    {children}
  </span>
)
