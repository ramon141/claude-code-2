import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { MessageSquare } from 'lucide-react'
import { Button } from '../../../../components/ui/Button'
import Field from '../../../Setup/components/Field'
import NgrokWebhook from '../../../Setup/components/NgrokWebhook'
import { extractErrorMessage, type ApiError } from '../../../Setup/errorMessage'
import SectionCard from './SectionCard'
import { useSetupControllerConfigureEvolution } from '../../../../api/generated/api'
import type {
  SetupControllerConfigureEvolutionBody,
  SetupControllerGenerateNgrokWebhookBody,
} from '../../../../api/generated/models'

interface EvolutionSectionProps {
  url: string
  token: string
  instanceName: string
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
