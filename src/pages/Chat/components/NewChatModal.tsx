import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { X, CheckCircle, XCircle, Loader } from 'lucide-react'
import { useState, useEffect } from 'react'
import type { ChatSessionsControllerCreateBody } from '../../../api/generated/models'
import {
  useProjectsControllerFind,
  useChatSessionsControllerVerifySession,
} from '../../../api/generated/api'

const schema = yup.object({
  chatName: yup.string().min(2, 'Mínimo 2 caracteres').required('Nome obrigatório'),
  projectId: yup.number().required('Projeto obrigatório').positive('Selecione um projeto'),
  sessionId: yup.string().trim().nullable().optional(),
})

type FormValues = {
  chatName: string
  projectId: number
  sessionId?: string | null
}

interface Props {
  onConfirm: (data: ChatSessionsControllerCreateBody) => Promise<void>
  onClose: () => void
  isLoading: boolean
}

const inputClass =
  'w-full h-10 px-3 bg-claude-bg border border-claude-border rounded-lg text-claude-text text-sm outline-none ' +
  'focus:border-claude-primary focus:ring-2 focus:ring-claude-primary/20 placeholder:text-claude-muted transition-all'

const selectClass =
  'w-full h-10 px-3 bg-claude-bg border border-claude-border rounded-lg text-claude-text text-sm outline-none ' +
  'focus:border-claude-primary focus:ring-2 focus:ring-claude-primary/20 transition-all appearance-none cursor-pointer'

export default function NewChatModal({ onConfirm, onClose, isLoading }: Props) {
  const [useExistingSession, setUseExistingSession] = useState(false)
  const [sessionIdError, setSessionIdError] = useState('')
  const [verifyParams, setVerifyParams] = useState<{sessionId: string; workDir: string} | undefined>()

  const { register, handleSubmit, control, watch, setValue, formState: { errors, isValid } } = useForm<FormValues>({
    resolver: yupResolver(schema),
    mode: 'onChange',
  })

  const { data: projects = [] } = useProjectsControllerFind()
  const sessionIdValue = watch('sessionId')
  const projectIdValue = watch('projectId')

  const selectedProject = projects.find(p => p.id === Number(projectIdValue))

  const { data: verifyData, isFetching: isVerifying } = useChatSessionsControllerVerifySession(
    verifyParams,
    { query: { enabled: !!verifyParams } },
  )

  const sessionExists = verifyData?.exists ?? null

  useEffect(() => {
    if (!useExistingSession) {
      setValue('sessionId', null)
      setVerifyParams(undefined)
      setSessionIdError('')
    }
  }, [useExistingSession, setValue])

  const handleVerify = () => {
    const sid = sessionIdValue?.trim()
    const workDir = selectedProject?.workDir
    if (!sid) return
    if (!workDir) {
      setSessionIdError('Selecione um projeto antes de verificar')
      return
    }
    setSessionIdError('')
    setVerifyParams({ sessionId: sid, workDir })
  }

  const onSubmit = async (data: FormValues) => {
    if (useExistingSession && !data.sessionId?.trim()) {
      setSessionIdError('Session ID obrigatório')
      return
    }
    setSessionIdError('')
    await onConfirm({
      chatName: data.chatName,
      projectId: data.projectId,
      sessionId: useExistingSession ? (data.sessionId?.trim() ?? null) : null,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-claude-surface rounded-2xl border border-claude-border p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-claude-text">Novo Chat</h2>
          <button onClick={onClose} className="text-claude-muted hover:text-claude-text transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-claude-muted uppercase tracking-wider mb-2">Nome do chat</label>
            <input type="text" placeholder="ex: meu-projeto" {...register('chatName')} className={inputClass} />
            {errors.chatName && <p className="text-xs text-red-400 mt-1">{errors.chatName.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-claude-muted uppercase tracking-wider mb-2">Projeto</label>
            <Controller
              name="projectId"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  className={selectClass}
                >
                  <option value="" disabled>Selecione um projeto</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name} — {project.workDir}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.projectId && <p className="text-xs text-red-400 mt-1">{errors.projectId.message}</p>}
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={useExistingSession}
              onChange={e => setUseExistingSession(e.target.checked)}
              className="w-4 h-4 accent-claude-primary cursor-pointer"
            />
            <span className="text-sm text-claude-text">Usar chat já existente</span>
          </label>

          {useExistingSession && (
            <ExistingSessionField
              register={register}
              sessionIdValue={sessionIdValue}
              selectedWorkDir={selectedProject?.workDir}
              isVerifying={isVerifying}
              sessionExists={sessionExists}
              sessionIdError={sessionIdError}
              onVerify={handleVerify}
              noProjectWarning={!selectedProject && !!sessionIdValue?.trim()}
            />
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 border border-claude-border text-claude-muted hover:text-claude-text hover:border-claude-text/30 rounded-xl text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!isValid || isLoading}
              className="flex-1 h-10 bg-claude-primary hover:bg-claude-primary-hover text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Criar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface ExistingSessionFieldProps {
  register: ReturnType<typeof useForm<FormValues>>['register']
  sessionIdValue?: string | null
  selectedWorkDir?: string
  isVerifying: boolean
  sessionExists: boolean | null
  sessionIdError: string
  onVerify: () => void
  noProjectWarning: boolean
}

function ExistingSessionField({
  register,
  sessionIdValue,
  isVerifying,
  sessionExists,
  sessionIdError,
  onVerify,
}: ExistingSessionFieldProps) {
  const hasSessionId = !!sessionIdValue?.trim()

  return (
    <div>
      <label className="block text-xs font-semibold text-claude-muted uppercase tracking-wider mb-2">
        Session ID do Claude
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="ex: 74e1c2c6-ea70-4805-8301-641845ca30c8"
            {...register('sessionId')}
            className={inputClass}
          />
          {isVerifying && (
            <Loader className="absolute right-3 top-3 w-4 h-4 text-claude-muted animate-spin" />
          )}
          {!isVerifying && sessionExists === true && (
            <CheckCircle className="absolute right-3 top-3 w-4 h-4 text-emerald-400" />
          )}
          {!isVerifying && sessionExists === false && (
            <XCircle className="absolute right-3 top-3 w-4 h-4 text-red-400" />
          )}
        </div>
        <button
          type="button"
          onClick={onVerify}
          disabled={!hasSessionId || isVerifying}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed ${
            hasSessionId && !isVerifying
              ? 'bg-claude-primary hover:bg-claude-primary-hover text-white'
              : 'border border-claude-border text-claude-muted'
          }`}
        >
          Verificar
        </button>
      </div>
      {sessionIdError && <p className="text-xs text-red-400 mt-1">{sessionIdError}</p>}
      {!isVerifying && sessionExists === true && (
        <p className="text-xs text-emerald-400 mt-1">Sessão encontrada.</p>
      )}
      {!isVerifying && sessionExists === false && (
        <p className="text-xs text-red-400 mt-1">Sessão não encontrada neste projeto.</p>
      )}
    </div>
  )
}
