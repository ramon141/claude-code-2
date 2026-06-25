import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { MessageSquare, RefreshCw } from 'lucide-react'
import { Button } from '../../../../components/ui/Button'
import Field from '../../../Setup/components/Field'
import NgrokWebhook from '../../../Setup/components/NgrokWebhook'
import { extractErrorMessage, type ApiError } from '../../../Setup/errorMessage'
import SectionCard from './SectionCard'
import {
  useSetupControllerConfigureEvolution,
  useSetupControllerEvolutionStatus,
} from '../../../../api/generated/api'
import type {
  SetupControllerConfigureEvolutionBody,
  SetupControllerGenerateNgrokWebhookBody,
  SetupControllerEvolutionStatus200State,
} from '../../../../api/generated/models'

interface EvolutionSectionProps {
  url: string
  token: string
  instanceName: string
}

const STATE_LABELS: Record<SetupControllerEvolutionStatus200State, string> = {
  open: 'Conectado',
  close: 'Desconectado',
  connecting: 'Conectando...',
  notConfigured: 'Não configurado',
  error: 'Erro',
}

const STATE_COLORS: Record<SetupControllerEvolutionStatus200State, string> = {
  open: 'bg-green-500/20 text-green-400 border-green-500/30',
  close: 'bg-red-500/20 text-red-400 border-red-500/30',
  connecting: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  notConfigured: 'bg-[#2A2A2A] text-[#7A7A7A] border-[#3A3A3A]',
  error: 'bg-red-500/20 text-red-400 border-red-500/30',
}

function ConnectionBadge() {
  const { data, isFetching, refetch } = useSetupControllerEvolutionStatus({
    query: { refetchInterval: 30_000 },
  })
  const state = data?.state ?? 'notConfigured'
  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${STATE_COLORS[state]}`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${state === 'open' ? 'bg-green-400 animate-pulse' : state === 'connecting' ? 'bg-yellow-400 animate-pulse' : 'bg-current opacity-60'}`}
        />
        {STATE_LABELS[state]}
        {data?.error && state === 'error' ? ` — ${data.error}` : ''}
      </span>
      <button
        type="button"
        onClick={() => void refetch()}
        disabled={isFetching}
        className="text-[#7A7A7A] hover:text-[#D97757] transition-colors"
        title="Atualizar status"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
      </button>
    </div>
  )
}

const EvolutionSection: React.FC<EvolutionSectionProps> = ({ url, token, instanceName }) => {
  const { register, handleSubmit, getValues } = useForm<SetupControllerConfigureEvolutionBody>({
    defaultValues: { url, token, instanceName },
  })
  const [apiError, setApiError] = useState('')
  const [saved, setSaved] = useState(false)
  const { mutateAsync, isPending } = useSetupControllerConfigureEvolution()

  const ngrokValues = (): SetupControllerGenerateNgrokWebhookBody => {
    const v = getValues()
    return { url: v.url, token: v.token, instanceName: v.instanceName }
  }

  const onSubmit = handleSubmit(async (data) => {
    setApiError('')
    setSaved(false)
    try {
      await mutateAsync({ data })
      setSaved(true)
    } catch (error) {
      setApiError(extractErrorMessage(error as ApiError))
    }
  })

  return (
    <SectionCard
      title="Evolution (WhatsApp)"
      description="Integração opcional. As alterações são aplicadas na hora."
      icon={<MessageSquare className="w-5 h-5" />}
      headerAction={<ConnectionBadge />}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="EVOLUTION_URL" placeholder="https://evolution.exemplo.com/" registration={register('url')} />
        <Field label="EVOLUTION_TOKEN" placeholder="token" registration={register('token')} />
        <Field label="EVOLUTION_INSTANCE_NAME" placeholder="instancia" registration={register('instanceName')} />

        <NgrokWebhook getValues={ngrokValues} />

        {apiError && <p className="text-red-400 text-sm">{apiError}</p>}
        {saved && <p className="text-green-400 text-sm">Configuração salva.</p>}

        <Button type="submit" loading={isPending} className="self-end">
          Salvar
        </Button>
      </form>
    </SectionCard>
  )
}

export default EvolutionSection
