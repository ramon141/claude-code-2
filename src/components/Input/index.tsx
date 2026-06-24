import React from 'react'
import { Info } from 'lucide-react'
import Tooltip from '../ui/Tooltip'
import { cn } from '../../lib/utils'
import type { ActionButtonProps, InputLabelProps, InputProps } from './types'

export const ActionButton: React.FC<ActionButtonProps> = ({ title, label, icon, ...rest }) => (
  <button
    type="button"
    className="inline-flex items-center gap-1 border border-border rounded-lg px-2 py-1 text-caption text-primary hover:bg-primary-light transition-colors"
    {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
  >
    {icon}
    {title || label}
  </button>
)

export const InputLabel: React.FC<InputLabelProps> = ({ label, actionButton, tooltipHelpText }) => (
  <div className="flex justify-between items-center mb-1.5">
    <div className="flex items-center gap-1">
      <span className="text-label uppercase tracking-wide text-slate-500">{label}</span>
      {tooltipHelpText && (
        <Tooltip title={tooltipHelpText}>
          <span className="inline-flex cursor-default">
            <Info className="w-3.5 h-3.5 text-muted" />
          </span>
        </Tooltip>
      )}
    </div>
    {(actionButton?.title || actionButton?.label) && <ActionButton {...actionButton} />}
  </div>
)

export const Input: React.FC<InputProps> = ({
  label,
  useForm,
  actionButton,
  sxInputLabel,
  tooltipHelpText,
  error,
  helperText,
  fullWidth,
  inputRef,
  className,
  ...rest
}) => {
  return (
    <div className={cn('w-full', !fullWidth && 'w-auto')}>
      {label && <InputLabel label={label} actionButton={actionButton} tooltipHelpText={tooltipHelpText} />}

      <input
        ref={inputRef}
        className={cn(
          'w-full h-10 px-3 text-body border rounded-lg outline-none transition-all',
          'bg-white border-border text-slate-800 placeholder:text-muted',
          'hover:border-slate-300',
          'focus:border-primary focus:ring-2 focus:ring-primary/10',
          'disabled:bg-slate-100 disabled:text-muted disabled:cursor-not-allowed',
          error && 'border-danger bg-danger-light focus:border-danger focus:ring-danger/10',
          className
        )}
        {...useForm}
        {...rest}
      />

      {helperText && (
        <p className={cn('text-caption mt-1', error ? 'text-danger' : 'text-muted')}>
          {helperText}
        </p>
      )}
    </div>
  )
}
