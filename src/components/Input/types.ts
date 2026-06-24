import type { ReactNode, InputHTMLAttributes } from 'react'

export interface ActionButtonProps {
  title?: string
  label?: string
  icon?: ReactNode
  onClick?: () => void
  [key: string]: unknown
}

export interface InputLabelProps {
  label: string
  actionButton?: ActionButtonProps
  sxInputLabel?: object
  tooltipHelpText?: string
}

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'label'> {
  label: string
  useForm?: Record<string, unknown>
  actionButton?: ActionButtonProps
  sxInputLabel?: object
  tooltipHelpText?: string
  error?: boolean
  helperText?: string
  fullWidth?: boolean
  inputRef?: React.Ref<HTMLInputElement>
}
