import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Database } from 'lucide-react'
import { Button } from '../../../../components/ui/Button'
import Field from '../../../Setup/components/Field'
import { extractErrorMessage, type ApiError } from '../../../Setup/errorMessage'
import SectionCard from './SectionCard'
import { useSetupControllerConfigureDatabase } from '../../../../api/generated/api'
import type { SetupControllerConfigureDatabaseBody } from '../../../../api/generated/models'

interface DatabaseSectionProps {
  databaseUrl: string
  onNeedRestart: () => void
}

const DatabaseSection: React.FC<DatabaseSectionProps> = ({ databaseUrl, onNeedRestart }) => {
  const { register, handleSubmit } = useForm<SetupControllerConfigureDatabaseBody>({
    defaultValues: { databaseUrl },
  })
  const [apiError, setApiError] = useState('')
  const { mutateAsync, isPending } = useSetupControllerConfigureDatabase()

  const onSubmit = handleSubmit(async (data) => {
    setApiError('')
    try {
      await mutateAsync({ data })
      onNeedRestart()
    } catch (error) {
      setApiError(extractErrorMessage(error as ApiError))
    }
  })

  return (
    <SectionCard
      title="Banco de dados"
      description="Ao salvar, testamos a conexão, rodamos as migrations e reiniciamos a aplicação."
      icon={<Database className="w-5 h-5" />}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field
          label="Database URL"
          placeholder="postgresql://usuario:senha@host:5432/banco"
          registration={register('databaseUrl', { required: true })}
        />
        {apiError && <p className="text-red-400 text-sm">{apiError}</p>}
        <Button type="submit" loading={isPending} className="self-end">
          {isPending ? 'Testando conexão...' : 'Salvar e reiniciar'}
        </Button>
      </form>
    </SectionCard>
  )
}

export default DatabaseSection
