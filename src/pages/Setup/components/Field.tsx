import React from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'

interface FieldProps {
  label: string
  placeholder?: string
  type?: string
  hint?: string
  error?: string
  registration: UseFormRegisterReturn
}

const Field: React.FC<FieldProps> = ({ label, placeholder, type = 'text', hint, error, registration }) => {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-claude-text text-sm font-medium">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        {...registration}
        className="bg-claude-surface border border-claude-border rounded-lg px-3 py-2 text-claude-text text-sm outline-none focus:border-claude-primary transition-colors placeholder:text-claude-muted"
      />
      {hint && !error && <span className="text-claude-muted text-xs">{hint}</span>}
      {error && <span className="text-red-400 text-xs">{error}</span>}
    </label>
  )
}

export default Field
