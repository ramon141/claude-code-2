import React, { useState } from 'react'
import { Network } from 'lucide-react'
import { extractErrorMessage, type ApiError } from '../../../Setup/errorMessage'
import SectionCard from './SectionCard'
import NgrokUrlDisplay from './NgrokUrlDisplay'
import { useSetupControllerToggleNgrok, getSetupControllerNgrokUrlQueryKey } from '../../../../api/generated/api'
import { useQueryClient } from '@tanstack/react-query'

interface NgrokSectionProps {
  enabled: boolean
  domain: string
  onNeedRestart: () => void
}

const NGROK_DOMAIN_PLACEHOLDER = 'ex: blessed-hedgehog.ngrok-free.app'

const NgrokSection: React.FC<NgrokSectionProps> = ({ enabled, domain, onNeedRestart }) => {
  const [checked, setChecked] = useState(enabled)
  const [domainValue, setDomainValue] = useState(domain)
  const [apiError, setApiError] = useState('')
  const { mutateAsync, isPending } = useSetupControllerToggleNgrok()

  const [domainSaved, setDomainSaved] = useState(false)
  const [waitingNgrok, setWaitingNgrok] = useState(false)
  const queryClient = useQueryClient()

  const toggle = async () => {
    const next = !checked
    setChecked(next)
    setApiError('')
    try {
      await mutateAsync({ data: { enabled: next, domain: domainValue.trim() || undefined } })
      onNeedRestart()
    } catch (error) {
      setChecked(!next)
      setApiError(extractErrorMessage(error as ApiError))
    }
  }

  const saveDomain = async () => {
    setApiError('')
    setDomainSaved(false)
    setWaitingNgrok(false)
    try {
      await mutateAsync({ data: { enabled: checked, domain: domainValue.trim() || undefined } })
      setDomainSaved(true)
      if (checked) {
        queryClient.removeQueries({ queryKey: getSetupControllerNgrokUrlQueryKey() })
        setWaitingNgrok(true)
      }
    } catch (error) {
      setApiError(extractErrorMessage(error as ApiError))
    }
  }

  return (
    <SectionCard
      title="Túnel ngrok"
      description="Expõe a API publicamente para receber webhooks. Requer reinício para aplicar."
      icon={<Network className="w-5 h-5" />}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-claude-text text-sm">
            {checked ? 'Ativado' : 'Desativado'}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={isPending}
            onClick={toggle}
            className={`relative w-11 h-6 rounded-full transition-colors disabled:opacity-50 ${
              checked ? 'bg-claude-primary' : 'bg-claude-border'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                checked ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-claude-muted text-xs font-medium uppercase tracking-wide">
            Domínio fixo (opcional)
          </label>
          <p className="text-claude-muted text-xs">
            URL reservada no ngrok free tier. Deixe em branco para usar URL aleatória.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={domainValue}
              onChange={e => setDomainValue(e.target.value)}
              placeholder={NGROK_DOMAIN_PLACEHOLDER}
              className="flex-1 bg-claude-bg border border-claude-border rounded-lg px-3 py-2 text-claude-text text-sm outline-none focus:border-claude-primary transition-colors"
            />
            <button
              type="button"
              disabled={isPending}
              onClick={saveDomain}
              className="px-3 py-2 bg-claude-primary hover:bg-claude-primary-hover disabled:opacity-50 rounded-lg text-white text-sm font-medium transition-colors whitespace-nowrap"
            >
              Salvar
            </button>
          </div>
        </div>

        {domainSaved && !waitingNgrok && (
          <p className="text-green-400 text-xs">Domínio salvo.</p>
        )}
        {checked && (
          <NgrokUrlDisplay
            polling={waitingNgrok}
            expectedDomain={domainValue.trim() || undefined}
            onUrlReady={() => setWaitingNgrok(false)}
          />
        )}
        {apiError && <p className="text-red-400 text-sm">{apiError}</p>}
      </div>
    </SectionCard>
  )
}

export default NgrokSection
