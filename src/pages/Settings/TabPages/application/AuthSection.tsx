import React, { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { extractErrorMessage, type ApiError } from '../../../Setup/errorMessage'
import SectionCard from './SectionCard'
import { useSetupControllerConfigureAuth } from '../../../../api/generated/api'

interface AuthSectionProps {
  authConfigured: boolean
}

const AuthSection: React.FC<AuthSectionProps> = ({ authConfigured }) => {
  const [password, setPassword] = useState('')
  const [saved, setSaved] = useState(false)
  const [apiError, setApiError] = useState('')
  const { mutateAsync, isPending } = useSetupControllerConfigureAuth()

  const save = async () => {
    setApiError('')
    setSaved(false)
    try {
      await mutateAsync({ data: { token: password } })
      setPassword('')
      setSaved(true)
    } catch (error) {
      setApiError(extractErrorMessage(error as ApiError))
    }
  }

  const description = authConfigured
    ? 'Senha definida. Digite uma nova para alterar, ou deixe em branco e salve para remover.'
    : 'Sem senha, o acesso externo (ngrok) fica aberto. Defina uma senha para proteger.'

  return (
    <SectionCard
      title="Senha de acesso externo"
      description={description}
      icon={<ShieldCheck className="w-5 h-5" />}
    >
      <div className="flex flex-col gap-3">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={authConfigured ? '••••••••' : 'Nova senha'}
          className="w-full px-3 py-2.5 bg-[#1A1A1A] border border-[#3A3A3A] rounded-lg text-[#F5F5F5] text-sm outline-none focus:border-[#D97757] transition-colors"
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void save()}
            disabled={isPending}
            className="px-4 py-2 bg-[#D97757] hover:bg-[#c96647] disabled:opacity-50 rounded-lg text-white text-sm font-medium transition-colors"
          >
            {isPending ? 'Salvando...' : 'Salvar senha'}
          </button>
          {saved && <span className="text-emerald-400 text-sm">Senha atualizada.</span>}
        </div>
        {apiError && <p className="text-red-400 text-sm">{apiError}</p>}
      </div>
    </SectionCard>
  )
}

export default AuthSection
