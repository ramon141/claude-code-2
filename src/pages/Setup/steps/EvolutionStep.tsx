import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { MessageSquare } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import Field from '../components/Field'
import NgrokWebhook from '../components/NgrokWebhook'
import { extractErrorMessage, type ApiError } from '../errorMessage'
import { useSetupControllerConfigureEvolution } from '../../../api/generated/api'
import type {
  SetupControllerConfigureEvolutionBody,
  SetupControllerGenerateNgrokWebhookBody,
} from '../../../api/generated/models'

interface EvolutionStepProps {
  onFinish: () => void
  onBack: () => void
  finishing: boolean
}

const EvolutionStep: React.FC<EvolutionStepProps> = ({ onFinish, onBack, finishing }) => {
  const { register, handleSubmit, getValues } = useForm<SetupControllerConfigureEvolutionBody>()
  const [apiError, setApiError] = useState('')
  const { mutateAsync, isPending } = useSetupControllerConfigureEvolution()

  const ngrokValues = (): SetupControllerGenerateNgrokWebhookBody => {
    const v = getValues()
    return { url: v.url, token: v.token ?? '', instanceName: v.instanceName }
  }

  const onSave = handleSubmit(async (data) => {
    setApiError('')
    try {
      await mutateAsync({ data })
      onFinish()
    } catch (error) {
      setApiError(extractErrorMessage(error as ApiError))
    }
  })

  return (
    <form onSubmit={onSave} className="flex flex-col gap-5">
      <header className="flex items-center gap-3">
        <MessageSquare className="w-5 h-5 text-claude-primary" />
        <div>
          <h2 className="text-claude-text font-semibold">Evolution (opcional)</h2>
          <p className="text-claude-muted text-sm">Integração WhatsApp. Pode pular e configurar depois.</p>
        </div>
      </header>

      <Field label="EVOLUTION_URL" placeholder="https://evolution.exemplo.com/" registration={register('url')} />
      <Field label="EVOLUTION_TOKEN" placeholder="token" registration={register('token')} />
      <Field label="EVOLUTION_INSTANCE_NAME" placeholder="instancia" registration={register('instanceName')} />

      <NgrokWebhook getValues={ngrokValues} />

      {apiError && <p className="text-red-400 text-sm">{apiError}</p>}

      <div className="flex justify-between">
        <Button type="button" variant="ghost" onClick={onBack}>Voltar</Button>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onFinish} loading={finishing}>
            Pular e finalizar
          </Button>
          <Button type="submit" loading={isPending || finishing}>Salvar e finalizar</Button>
        </div>
      </div>
    </form>
  )
}

export default EvolutionStep
