import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { X, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import type { ClaudeCodeApiKey } from '../../../api/generated/models'

const createSchema = yup.object({
  name: yup.string().min(2, 'Mínimo 2 caracteres').required('Nome obrigatório'),
  keyValue: yup.string().min(10, 'Chave inválida').required('Chave obrigatória'),
})

const editSchema = yup.object({
  name: yup.string().min(2, 'Mínimo 2 caracteres').required('Nome obrigatório'),
})

type CreateFormValues = { name: string; keyValue: string }
type EditFormValues = { name: string }

interface CreateProps {
  onConfirm: (data: CreateFormValues) => Promise<void>
  onClose: () => void
  isLoading: boolean
}

interface EditProps {
  apiKey: ClaudeCodeApiKey
  onConfirm: (data: EditFormValues) => Promise<void>
  onClose: () => void
  isLoading: boolean
}

type Props = CreateProps | EditProps

const inputClass =
  'w-full h-10 px-3 bg-[#1A1A1A] border border-[#3A3A3A] rounded-lg text-[#F5F5F5] text-sm outline-none ' +
  'focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/20 placeholder:text-[#9A9A9A] transition-all'

function CreateModal({ onConfirm, onClose, isLoading }: CreateProps) {
  const [showKey, setShowKey] = useState(false)
  const { register, handleSubmit, formState: { errors, isValid } } = useForm<CreateFormValues>({
    resolver: yupResolver(createSchema),
    mode: 'onChange',
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-[#2A2A2A] rounded-2xl border border-[#3A3A3A] p-6 w-full max-w-md shadow-2xl">
        <ModalHeader title="Nova API Key" onClose={onClose} />
        <form onSubmit={handleSubmit(onConfirm)} className="space-y-4">
          <FormField label="Nome" error={errors.name?.message}>
            <input type="text" placeholder="ex: Minha chave de produção" {...register('name')} className={inputClass} />
          </FormField>
          <FormField label="Chave API (Anthropic)" error={errors.keyValue?.message}>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                placeholder="sk-ant-..."
                {...register('keyValue')}
                className={inputClass + ' pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A9A9A] hover:text-[#F5F5F5]"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </FormField>
          <ModalActions onClose={onClose} isLoading={isLoading} isValid={isValid} label="Criar" />
        </form>
      </div>
    </div>
  )
}

function EditModal({ apiKey, onConfirm, onClose, isLoading }: EditProps) {
  const { register, handleSubmit, reset, formState: { errors, isValid } } = useForm<EditFormValues>({
    resolver: yupResolver(editSchema),
    mode: 'onChange',
  })

  useEffect(() => {
    reset({ name: apiKey.name })
  }, [apiKey, reset])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-[#2A2A2A] rounded-2xl border border-[#3A3A3A] p-6 w-full max-w-md shadow-2xl">
        <ModalHeader title="Editar API Key" onClose={onClose} />
        <form onSubmit={handleSubmit(onConfirm)} className="space-y-4">
          <FormField label="Nome" error={errors.name?.message}>
            <input type="text" placeholder="ex: Minha chave de produção" {...register('name')} className={inputClass} />
          </FormField>
          <ModalActions onClose={onClose} isLoading={isLoading} isValid={isValid} label="Salvar" />
        </form>
      </div>
    </div>
  )
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-lg font-semibold text-[#F5F5F5]">{title}</h2>
      <button onClick={onClose} className="text-[#9A9A9A] hover:text-[#F5F5F5] transition-colors">
        <X className="w-5 h-5" />
      </button>
    </div>
  )
}

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#9A9A9A] uppercase tracking-wider mb-2">{label}</label>
      {children}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )
}

function ModalActions({ onClose, isLoading, isValid, label }: { onClose: () => void; isLoading: boolean; isValid: boolean; label: string }) {
  return (
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
        {label}
      </button>
    </div>
  )
}

function isEditProps(props: Props): props is EditProps {
  return 'apiKey' in props
}

export default function ClaudeApiKeyModal(props: Props) {
  if (isEditProps(props)) return <EditModal {...props} />
  return <CreateModal {...props} />
}
