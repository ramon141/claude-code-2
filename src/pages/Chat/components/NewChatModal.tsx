import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { X } from 'lucide-react'
import type { ChatSessionsControllerCreateBody } from '../../../api/generated/models'
import { useProjectsControllerFind } from '../../../api/generated/api'

const schema = yup.object({
  chatName: yup.string().min(2, 'Mínimo 2 caracteres').required('Nome obrigatório'),
  projectId: yup.number().required('Projeto obrigatório').positive('Selecione um projeto'),
})

interface Props {
  onConfirm: (data: ChatSessionsControllerCreateBody) => Promise<void>
  onClose: () => void
  isLoading: boolean
}

const inputClass =
  'w-full h-10 px-3 bg-[#1A1A1A] border border-[#3A3A3A] rounded-lg text-[#F5F5F5] text-sm outline-none ' +
  'focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/20 placeholder:text-[#9A9A9A] transition-all'

const selectClass =
  'w-full h-10 px-3 bg-[#1A1A1A] border border-[#3A3A3A] rounded-lg text-[#F5F5F5] text-sm outline-none ' +
  'focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/20 transition-all appearance-none cursor-pointer'

export default function NewChatModal({ onConfirm, onClose, isLoading }: Props) {
  const { register, handleSubmit, control, formState: { errors, isValid } } = useForm<ChatSessionsControllerCreateBody>({
    resolver: yupResolver(schema),
    mode: 'onChange',
  })

  const { data: projects = [] } = useProjectsControllerFind()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-[#2A2A2A] rounded-2xl border border-[#3A3A3A] p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-[#F5F5F5]">Novo Chat</h2>
          <button onClick={onClose} className="text-[#9A9A9A] hover:text-[#F5F5F5] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onConfirm)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#9A9A9A] uppercase tracking-wider mb-2">Nome do chat</label>
            <input type="text" placeholder="ex: meu-projeto" {...register('chatName')} className={inputClass} />
            {errors.chatName && <p className="text-xs text-red-400 mt-1">{errors.chatName.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#9A9A9A] uppercase tracking-wider mb-2">Projeto</label>
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

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 border border-[#3A3A3A] text-[#9A9A9A] hover:text-[#F5F5F5] hover:border-[#F5F5F5]/30 rounded-xl text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!isValid || isLoading}
              className="flex-1 h-10 bg-[#D97757] hover:bg-[#C4663F] text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
