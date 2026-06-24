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
      <span className="text-[#F5F5F5] text-sm font-medium">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        {...registration}
        className="bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg px-3 py-2 text-[#F5F5F5] text-sm outline-none focus:border-[#D97757] transition-colors placeholder:text-[#6A6A6A]"
      />
      {hint && !error && <span className="text-[#9A9A9A] text-xs">{hint}</span>}
      {error && <span className="text-red-400 text-xs">{error}</span>}
    </label>
  )
}

export default Field
