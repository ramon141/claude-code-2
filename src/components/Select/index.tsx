import { forwardRef } from 'react'
import ReactSelect, { type SelectInstance } from 'react-select'
import { InputLabel } from '../Input'
import { cn } from '../../lib/utils'
import type { SelectProps } from './types'

const PRIMARY = '#2563EB'
const PRIMARY_LIGHT = '#EFF6FF'
const DANGER = '#EF4444'
const DANGER_LIGHT = '#FEF2F2'
const BORDER = '#E2E8F0'
const BORDER_HOVER = '#CBD5E1'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Select = forwardRef<SelectInstance<any>, SelectProps>(
  ({ title, label, actionButton, sxInputLabel, error, helperText, tooltipHelpText, ...rest }, ref) => {

    const customStyles = {
      control: (base: Record<string, unknown>, state: { isFocused: boolean }) => ({
        ...base,
        height: '40px',
        minHeight: '40px',
        borderRadius: '8px',
        backgroundColor: error ? DANGER_LIGHT : '#FFFFFF',
        border: `1px solid ${error ? DANGER : state.isFocused ? PRIMARY : BORDER}`,
        boxShadow: state.isFocused
          ? `0 0 0 2px ${error ? 'rgba(239,68,68,0.1)' : 'rgba(37,99,235,0.1)'}`
          : 'none',
        '&:hover': { borderColor: error ? DANGER : state.isFocused ? PRIMARY : BORDER_HOVER },
        transition: 'all 150ms',
      }),
      valueContainer: (base: Record<string, unknown>) => ({
        ...base,
        height: '38px',
        padding: '0 10px',
        fontSize: '0.875rem',
      }),
      input: (base: Record<string, unknown>) => ({ ...base, margin: 0, padding: 0 }),
      indicatorsContainer: (base: Record<string, unknown>) => ({ ...base, height: '38px' }),
      option: (base: Record<string, unknown>, { isDisabled, isFocused, isSelected }: { isDisabled: boolean; isFocused: boolean; isSelected: boolean }) => ({
        ...base,
        backgroundColor: isSelected ? PRIMARY : isFocused ? PRIMARY_LIGHT : 'transparent',
        color: isSelected ? 'white' : '#374151',
        fontSize: '0.875rem',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        ':active': { backgroundColor: isSelected ? PRIMARY : PRIMARY_LIGHT },
      }),
      menu: (base: Record<string, unknown>) => ({
        ...base,
        zIndex: 9999,
        borderRadius: '8px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
        border: `1px solid ${BORDER}`,
        overflow: 'hidden',
      }),
      menuList: (base: Record<string, unknown>) => ({ ...base, padding: '4px' }),
      singleValue: (base: Record<string, unknown>) => ({ ...base, color: '#1E293B', fontSize: '0.875rem' }),
      placeholder: (base: Record<string, unknown>) => ({ ...base, color: '#94A3B8', fontSize: '0.875rem' }),
    }

    return (
      <div>
        <InputLabel
          label={title || label || ''}
          actionButton={actionButton}
          sxInputLabel={sxInputLabel}
          tooltipHelpText={tooltipHelpText}
        />

        <ReactSelect
          ref={ref}
          styles={customStyles}
          menuPosition="fixed"
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
)

Select.displayName = 'Select'

export default Select
