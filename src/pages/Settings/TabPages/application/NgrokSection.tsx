import React, { useState } from 'react'
import { Network } from 'lucide-react'
import { extractErrorMessage, type ApiError } from '../../../Setup/errorMessage'
import SectionCard from './SectionCard'
import NgrokUrlDisplay from './NgrokUrlDisplay'
import { useSetupControllerToggleNgrok } from '../../../../api/generated/api'

interface NgrokSectionProps {
  enabled: boolean
  onNeedRestart: () => void
}

const NgrokSection: React.FC<NgrokSectionProps> = ({ enabled, onNeedRestart }) => {
  const [checked, setChecked] = useState(enabled)
  const [apiError, setApiError] = useState('')
  const { mutateAsync, isPending } = useSetupControllerToggleNgrok()

  const toggle = async () => {
    const next = !checked
    setApiError('')
    setChecked(next)
    try {
      await mutateAsync({ data: { enabled: next } })
      onNeedRestart()
    } catch (error) {
      setChecked(!next)
      setApiError(extractErrorMessage(error as ApiError))
    }
  }

  return (
    <SectionCard
      title="Túnel ngrok"
      description="Expõe a API publicamente para receber webhooks. Requer reinício para aplicar."
      icon={<Network className="w-5 h-5" />}
    >
      <div className="flex items-center justify-between">
        <span className="text-[#F5F5F5] text-sm">
          {checked ? 'Ativado' : 'Desativado'}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={isPending}
          onClick={toggle}
          className={`relative w-11 h-6 rounded-full transition-colors disabled:opacity-50 ${
            checked ? 'bg-[#D97757]' : 'bg-[#3A3A3A]'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
              checked ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
      {checked && <NgrokUrlDisplay />}
      {apiError && <p className="text-red-400 text-sm">{apiError}</p>}
    </SectionCard>
  )
}

export default NgrokSection
