import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Database } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import Field from '../components/Field'
import { extractErrorMessage, type ApiError } from '../errorMessage'
import { useSetupControllerConfigureDatabase } from '../../../api/generated/api'
import type { SetupControllerConfigureDatabaseBody } from '../../../api/generated/models'

interface DatabaseStepProps {
  onNext: () => void
}

const DatabaseStep: React.FC<DatabaseStepProps> = ({ onNext }) => {
  const { register, handleSubmit } = useForm<SetupControllerConfigureDatabaseBody>()
  const [apiError, setApiError] = useState('')
  const { mutateAsync, isPending } = useSetupControllerConfigureDatabase()

  const onSubmit = handleSubmit(async (data) => {
    setApiError('')
    try {
      await mutateAsync({ data })
      onNext()
    } catch (error) {
      setApiError(extractErrorMessage(error as ApiError))
    }
  })

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <header className="flex items-center gap-3">
        <Database className="w-5 h-5 text-claude-primary" />
        <div>
          <h2 className="text-claude-text font-semibold">Banco de dados</h2>
          <p className="text-claude-muted text-sm">Testaremos a conexão e rodaremos as migrations.</p>
        </div>
      </header>

      <Field
        label="Database URL"
        placeholder="postgresql://usuario:senha@host:5432/banco"
        hint="Conexão PostgreSQL usada pela aplicação."
        registration={register('databaseUrl', { required: true })}
      />

      {apiError && <p className="text-red-400 text-sm">{apiError}</p>}

      <Button type="submit" loading={isPending} className="self-end">
        {isPending ? 'Testando conexão...' : 'Avançar'}
      </Button>
    </form>
  )
}

export default DatabaseStep
