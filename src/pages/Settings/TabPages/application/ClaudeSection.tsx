import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Terminal } from 'lucide-react'
import { Button } from '../../../../components/ui/Button'
import Field from '../../../Setup/components/Field'
import { extractErrorMessage, type ApiError } from '../../../Setup/errorMessage'
import SectionCard from './SectionCard'
import { useSetupControllerConfigureClaude } from '../../../../api/generated/api'
import type { SetupControllerConfigureClaudeBody } from '../../../../api/generated/models'

interface ClaudeSectionProps {
  claudeCommand: string
  timeout: number
  onNeedRestart: () => void
}

const ClaudeSection: React.FC<ClaudeSectionProps> = ({ claudeCommand, timeout, onNeedRestart }) => {
  const { register, handleSubmit } = useForm<SetupControllerConfigureClaudeBody>({
    defaultValues: { claudeCommand, timeout },
  })
  const [apiError, setApiError] = useState('')
  const { mutateAsync, isPending } = useSetupControllerConfigureClaude()

  const onSubmit = handleSubmit(async (data) => {
    setApiError('')
    try {
      await mutateAsync({ data: { ...data, timeout: Number(data.timeout) } })
      onNeedRestart()
    } catch (error) {
      setApiError(extractErrorMessage(error as ApiError))
    }
  })

  return (
    <SectionCard
      title="Claude"
      description="Comando do CLI e tempo limite. Requer reinício para aplicar."
      icon={<Terminal className="w-5 h-5" />}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field
          label="CLAUDE_COMMAND"
          placeholder="claude"
          registration={register('claudeCommand', { required: true })}
        />
        <Field
          label="TIMEOUT (segundos)"
          type="number"
          placeholder="3600"
          registration={register('timeout', { required: true, valueAsNumber: true })}
        />
        {apiError && <p className="text-red-400 text-sm">{apiError}</p>}
        <Button type="submit" loading={isPending} className="self-end">
          Salvar e reiniciar
        </Button>
      </form>
    </SectionCard>
  )
}

export default ClaudeSection
