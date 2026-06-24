import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Terminal } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import Field from '../components/Field'
import { extractErrorMessage, type ApiError } from '../errorMessage'
import { useSetupControllerConfigureClaude } from '../../../api/generated/api'
import type { SetupControllerConfigureClaudeBody } from '../../../api/generated/models'

interface ClaudeStepProps {
  onNext: () => void
  onBack: () => void
}

const DEFAULT_COMMAND = 'claude'
const DEFAULT_TIMEOUT = 3600

const ClaudeStep: React.FC<ClaudeStepProps> = ({ onNext, onBack }) => {
  const { register, handleSubmit } = useForm<SetupControllerConfigureClaudeBody>({
    defaultValues: { claudeCommand: DEFAULT_COMMAND, timeout: DEFAULT_TIMEOUT },
  })
  const [apiError, setApiError] = useState('')
  const { mutateAsync, isPending } = useSetupControllerConfigureClaude()

  const onSubmit = handleSubmit(async (data) => {
    setApiError('')
    try {
      await mutateAsync({ data: { ...data, timeout: Number(data.timeout) } })
      onNext()
    } catch (error) {
      setApiError(extractErrorMessage(error as ApiError))
    }
  })

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <header className="flex items-center gap-3">
        <Terminal className="w-5 h-5 text-[#D97757]" />
        <div>
          <h2 className="text-[#F5F5F5] font-semibold">Claude</h2>
          <p className="text-[#9A9A9A] text-sm">Comando do CLI e tempo limite de execução.</p>
        </div>
      </header>

      <Field
        label="CLAUDE_COMMAND"
        placeholder="claude"
        hint="Comando usado para invocar o Claude Code."
        registration={register('claudeCommand', { required: true })}
      />
      <Field
        label="TIMEOUT (segundos)"
        type="number"
        placeholder="3600"
        hint="Tempo máximo de cada execução."
        registration={register('timeout', { required: true, valueAsNumber: true })}
      />

      {apiError && <p className="text-red-400 text-sm">{apiError}</p>}

      <div className="flex justify-between">
        <Button type="button" variant="ghost" onClick={onBack}>Voltar</Button>
        <Button type="submit" loading={isPending}>Avançar</Button>
      </div>
    </form>
  )
}

export default ClaudeStep
