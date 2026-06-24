import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 font-semibold rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none',
  {
    variants: {
      variant: {
        primary:   'bg-primary text-white hover:bg-primary-hover focus-visible:ring-primary shadow-sm',
        secondary: 'bg-white text-slate-700 border border-border hover:bg-slate-50 focus-visible:ring-slate-400',
        ghost:     'bg-transparent text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-400',
        danger:    'bg-danger text-white hover:bg-danger-hover focus-visible:ring-danger shadow-sm',
        'danger-ghost': 'bg-transparent text-danger hover:bg-danger-light focus-visible:ring-danger',
        success:   'bg-success text-white hover:bg-success-hover focus-visible:ring-success shadow-sm',
      },
      size: {
        sm: 'h-7  px-3   text-caption',
        md: 'h-9  px-4   text-body',
        lg: 'h-11 px-5   text-subhead',
      },
      iconOnly: {
        true:  'px-0 aspect-square',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      iconOnly: false,
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
}

export const Button: React.FC<ButtonProps> = ({
  className, variant, size, iconOnly, loading, disabled, children, ...rest
}) => {
  return (
    <button
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size, iconOnly }), className)}
      {...rest}
    >
      {loading ? <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : null}
      {children}
    </button>
  )
}

export { buttonVariants }
