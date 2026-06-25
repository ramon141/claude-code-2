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
  tokenConfigured: boolean
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
  notConfigured: 'bg-claude-surface text-claude-muted border-claude-border',
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
        className="text-claude-muted hover:text-claude-primary transition-colors"
        title="Atualizar status"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
      </button>
    </div>
  )
}

const EvolutionSection: React.FC<EvolutionSectionProps> = ({ url, tokenConfigured, instanceName }) => {
  const [editingToken, setEditingToken] = useState(!tokenConfigured)
  const { register, handleSubmit, getValues } = useForm<SetupControllerConfigureEvolutionBody>({
    defaultValues: { url, token: '', instanceName },
  })
  const [apiError, setApiError] = useState('')
  const [saved, setSaved] = useState(false)
  const { mutateAsync, isPending } = useSetupControllerConfigureEvolution()

  const ngrokValues = (): SetupControllerGenerateNgrokWebhookBody => {
    const v = getValues()
    return { url: v.url, token: v.token ?? '', instanceName: v.instanceName }
  }

  const onSubmit = handleSubmit(async (data) => {
    setApiError('')
    setSaved(false)
    try {
      const payload: SetupControllerConfigureEvolutionBody = {
        url: data.url,
        instanceName: data.instanceName,
        ...(editingToken && data.token ? { token: data.token } : {}),
      }
      await mutateAsync({ data: payload })
      setSaved(true)
      if (editingToken && data.token) setEditingToken(false)
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

        {editingToken ? (
          <Field label="EVOLUTION_TOKEN" placeholder="token" registration={register('token')} />
        ) : (
          <div className="flex flex-col gap-1">
            <label className="text-claude-muted text-xs font-medium uppercase tracking-wide">EVOLUTION_TOKEN</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value="••••••••"
                disabled
                className="flex-1 bg-claude-bg border border-claude-border rounded-lg px-3 py-2 text-claude-muted text-sm opacity-60 cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setEditingToken(true)}
                className="text-claude-primary text-xs hover:underline whitespace-nowrap"
              >
                Alterar
              </button>
            </div>
          </div>
        )}

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
