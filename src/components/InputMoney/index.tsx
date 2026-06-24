import React from 'react'
import CurrencyInput from 'react-currency-input-field'
import { InputLabel } from '../Input'
import { cn } from '../../lib/utils'
import type { InputMoneyProps } from './types'

export default function InputMoney({
  value, setValue, name, prefix = 'R$ ', label, sxInputLabel, actionButton, error, helperText, ...rest
}: InputMoneyProps) {

  const handleValueChange = (newValue: string | undefined, fieldName?: string) => {
    if (setValue && newValue) setValue(newValue)
    if (rest.onChange) {
      const event = {
        target: { name: fieldName || '', value: newValue || '' },
      } as React.ChangeEvent<HTMLInputElement>
      rest.onChange(event, newValue || '')
    }
  }

  const { onChange, ...currencyInputProps } = rest

  return (
    <div className="w-full">
      <InputLabel label={label} actionButton={actionButton} sxInputLabel={sxInputLabel} />

      <CurrencyInput
        className={cn(
          'w-full h-10 px-3 text-body border rounded-lg outline-none transition-all',
          'bg-white border-border text-slate-800 placeholder:text-muted',
          'hover:border-slate-300',
          'focus:border-primary focus:ring-2 focus:ring-primary/10',
          'disabled:bg-slate-100 disabled:text-muted disabled:cursor-not-allowed',
          error && 'border-danger bg-danger-light focus:border-danger focus:ring-danger/10',
        )}
        name={name}
        value={value}
        onValueChange={handleValueChange}
        prefix={prefix}
        decimalsLimit={2}
        decimalScale={2}
        decimalSeparator=","
        groupSeparator="."
        disabled={rest.disabled}
        placeholder={rest.placeholder || '0,00'}
        allowNegativeValue={false}
        maxLength={9}
        {...currencyInputProps}
      />

      {helperText && (
        <p className={cn('text-caption mt-1', error ? 'text-danger' : 'text-muted')}>{helperText}</p>
      )}
    </div>
  )
}
