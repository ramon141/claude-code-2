import { useForm } from 'react-hook-form'
import { X, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { usePromptsControllerUpdateById, usePromptsControllerDeleteById } from '../../api/generated/api'
import type { Prompt } from '../../api/generated/models'

const inputClass =
  'w-full px-3 py-2.5 bg-claude-bg border border-claude-border rounded-lg text-claude-text text-sm outline-none ' +
  'focus:border-claude-primary focus:ring-2 focus:ring-claude-primary/20 placeholder:text-claude-muted transition-all'

type FormValues = { content: string }

interface Props {
  prompt: Prompt
  onClose: () => void
  onUpdated: () => void
}

export default function PromptEditModal({ prompt, onClose, onUpdated }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { mutateAsync: updatePrompt, isLoading: isSaving } = usePromptsControllerUpdateById()
  const { mutateAsync: deletePrompt, isLoading: isDeleting } = usePromptsControllerDeleteById()

  const { register, handleSubmit, formState: { isDirty, isValid } } = useForm<FormValues>({
    defaultValues: { content: prompt.content ?? '' },
    mode: 'onChange',
  })

  const onSubmit = async (values: FormValues) => {
    if (prompt.id == null) return
    await updatePrompt({ id: prompt.id, data: { content: values.content.trim() } })
    onUpdated()
    onClose()
  }

  const handleDelete = async () => {
    if (prompt.id == null) return
    await deletePrompt({ id: prompt.id })
    onUpdated()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-claude-surface border border-claude-border rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-claude-border">
          <div>
            <h2 className="text-claude-text font-semibold text-base">Prompt #{prompt.id}</h2>
            <p className="text-claude-muted text-xs mt-0.5">{prompt.chatName} · {prompt.status}</p>
          </div>
          <button type="button" onClick={onClose} className="text-claude-muted hover:text-claude-text transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-claude-muted uppercase tracking-wider mb-2">Conteúdo</label>
            <textarea
              {...register('content', { required: true, minLength: 1 })}
              rows={6}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="flex gap-3 pt-2">
            {confirmDelete ? (
              <>
                <span className="flex-1 text-sm text-red-400 self-center">Confirmar exclusão?</span>
                <button type="button" onClick={() => setConfirmDelete(false)}
                  className="px-3 h-10 border border-claude-border text-claude-muted hover:text-claude-text rounded-xl text-sm transition-colors">
                  Cancelar
                </button>
                <button type="button" onClick={handleDelete} disabled={isDeleting}
                  className="px-4 h-10 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold rounded-xl text-sm flex items-center gap-2 transition-colors disabled:opacity-50">
                  {isDeleting && <span className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />}
                  Deletar
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 px-3 h-10 text-red-400 hover:bg-red-500/10 rounded-xl text-sm transition-colors">
                  <Trash2 className="w-4 h-4" />
                  Deletar
                </button>
                <div className="flex-1" />
                <button type="button" onClick={onClose}
                  className="px-3 h-10 border border-claude-border text-claude-muted hover:text-claude-text rounded-xl text-sm transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={!isDirty || !isValid || isSaving}
                  className="px-4 h-10 bg-claude-primary hover:bg-claude-primary/80 text-white font-semibold rounded-xl text-sm flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSaving && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  Salvar
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
