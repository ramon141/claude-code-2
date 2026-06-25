import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { X, FolderOpen } from 'lucide-react'
import { open } from '@tauri-apps/plugin-dialog'
import type { Project } from '../../../api/generated/models'

const schema = yup.object({
  name: yup.string().min(2, 'Mínimo 2 caracteres').required('Nome obrigatório'),
  workDir: yup.string().required('Diretório obrigatório'),
  memory: yup.string().nullable().optional(),
})

type FormValues = {
  name: string
  workDir: string
  memory?: string | null
}

interface Props {
  project?: Project
  onConfirm: (data: FormValues) => Promise<void>
  onClose: () => void
  isLoading: boolean
}

const inputClass =
  'w-full h-10 px-3 bg-claude-bg border border-claude-border rounded-lg text-claude-text text-sm outline-none ' +
  'focus:border-claude-primary focus:ring-2 focus:ring-claude-primary/20 placeholder:text-claude-muted transition-all'

const textareaClass =
  'w-full px-3 py-2 bg-claude-bg border border-claude-border rounded-lg text-claude-text text-sm outline-none ' +
  'focus:border-claude-primary focus:ring-2 focus:ring-claude-primary/20 placeholder:text-claude-muted transition-all resize-none'

export default function ProjectModal({ project, onConfirm, onClose, isLoading }: Props) {
  const isEditing = !!project

  const { register, handleSubmit, reset, setValue, formState: { errors, isValid } } = useForm<FormValues>({
    resolver: yupResolver(schema),
    mode: 'onChange',
  })

  const selectFolder = async () => {
    const selected = await open({ directory: true, multiple: false })
    if (typeof selected === 'string') {
      setValue('workDir', selected, { shouldValidate: true, shouldDirty: true })
    }
  }

  useEffect(() => {
    if (project) {
      reset({ name: project.name, workDir: project.workDir, memory: project.memory ?? '' })
    }
  }, [project, reset])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-claude-surface rounded-2xl border border-claude-border p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-claude-text">
            {isEditing ? 'Editar Projeto' : 'Novo Projeto'}
          </h2>
          <button onClick={onClose} className="text-claude-muted hover:text-claude-text transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onConfirm)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-claude-muted uppercase tracking-wider mb-2">Nome</label>
            <input type="text" placeholder="ex: meu-projeto" {...register('name')} className={inputClass} />
            {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-claude-muted uppercase tracking-wider mb-2">Diretório de trabalho</label>
            <div className="flex gap-2">
              <input type="text" placeholder="ex: /home/user/project" {...register('workDir')} className={inputClass} />
              <button
                type="button"
                onClick={selectFolder}
                title="Selecionar pasta"
                className="shrink-0 h-10 px-3 flex items-center gap-2 border border-claude-border text-claude-muted hover:text-claude-text hover:border-claude-primary rounded-lg text-sm transition-colors"
              >
                <FolderOpen className="w-4 h-4" />
                Procurar
              </button>
            </div>
            {errors.workDir && <p className="text-xs text-red-400 mt-1">{errors.workDir.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-claude-muted uppercase tracking-wider mb-2">
              Memory <span className="normal-case text-claude-muted font-normal">(opcional)</span>
            </label>
            <textarea
              rows={3}
              placeholder="Instruções adicionais para o Claude..."
              {...register('memory')}
              className={textareaClass}
            />
          </div>

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
              {isEditing ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
