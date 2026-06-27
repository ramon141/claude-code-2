import { useForm, Controller } from 'react-hook-form'
import { X } from 'lucide-react'
import { useChatSessionsControllerFind, usePromptsControllerCreate } from '../../api/generated/api'
import type { PromptsControllerCreateBodyStatus } from '../../api/generated/models'

const DRAFT_STATUS = 'draft' as PromptsControllerCreateBodyStatus

const inputClass =
  'w-full px-3 py-2.5 bg-claude-bg border border-claude-border rounded-lg text-claude-text text-sm outline-none ' +
  'focus:border-claude-primary focus:ring-2 focus:ring-claude-primary/20 placeholder:text-claude-muted transition-all'

const selectClass =
  'w-full px-3 py-2.5 bg-claude-bg border border-claude-border rounded-lg text-claude-text text-sm outline-none ' +
  'focus:border-claude-primary focus:ring-2 focus:ring-claude-primary/20 transition-all appearance-none cursor-pointer'

type FormValues = { chatName: string; content: string }

interface Props {
  onClose: () => void
  onCreated: () => void
}

export default function CreatePromptModal({ onClose, onCreated }: Props) {
  const { data: sessions = [] } = useChatSessionsControllerFind()
  const { mutateAsync: createPrompt, isLoading } = usePromptsControllerCreate()

  const { register, handleSubmit, control, formState: { errors, isValid } } = useForm<FormValues>({
    defaultValues: { chatName: '', content: '' },
    mode: 'onChange',
  })

  const onSubmit = async (values: FormValues) => {
    const session = sessions.find(s => s.chatName === values.chatName)
    if (!session?.workingDirectory) return
    await createPrompt({
      data: {
        content: values.content.trim(),
        workingDirectory: session.workingDirectory,
        chatName: values.chatName,
        status: DRAFT_STATUS,
      },
    })
    onCreated()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-claude-surface border border-claude-border rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-claude-border">
          <h2 className="text-claude-text font-semibold text-base">Novo Prompt</h2>
          <button type="button" onClick={onClose} className="text-claude-muted hover:text-claude-text transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-claude-muted uppercase tracking-wider mb-2">Chat de destino</label>
            <Controller
              name="chatName"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <select {...field} className={selectClass}>
                  <option value="">Selecione um chat...</option>
                  {sessions.map(s => (
                    <option key={s.id} value={s.chatName ?? ''}>{s.chatName} — {s.projectName}</option>
                  ))}
                </select>
              )}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-claude-muted uppercase tracking-wider mb-2">Prompt</label>
            <textarea
              {...register('content', { required: true, minLength: 1 })}
              placeholder="O que o Claude deve fazer?"
              rows={5}
              className={`${inputClass} resize-none`}
            />
            {errors.content && <p className="text-xs text-red-400 mt-1">Campo obrigatório</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 h-10 border border-claude-border text-claude-muted hover:text-claude-text rounded-xl text-sm font-medium transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={!isValid || isLoading}
              className="flex-1 h-10 bg-claude-primary hover:bg-claude-primary/80 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Adicionar como Rascunho
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
