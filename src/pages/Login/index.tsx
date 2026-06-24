import React, { useState } from 'react'
import type { AxiosError } from 'axios'
import { Lock } from 'lucide-react'
import { setupControllerStatus } from '../../api/generated/api'
import { setAuthToken } from '../../api/apiConfig'

const UNAUTHORIZED = 401

interface LoginProps {
  onAuthenticated: () => void
}

const Login: React.FC<LoginProps> = ({ onAuthenticated }) => {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (password.length === 0) return
    setLoading(true)
    setError('')
    setAuthToken(password)
    try {
      await setupControllerStatus()
      onAuthenticated()
    } catch (err) {
      setAuthToken('')
      const status = (err as AxiosError).response?.status
      setError(status === UNAUTHORIZED ? 'Senha incorreta.' : 'Falha ao conectar à API.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm bg-[#2A2A2A] rounded-2xl border border-[#3A3A3A] p-6 flex flex-col gap-5"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-xl bg-[#D97757]/10 border border-[#D97757]/20 flex items-center justify-center">
            <Lock className="w-6 h-6 text-[#D97757]" />
          </div>
          <div>
            <h1 className="text-[#F5F5F5] font-semibold">Acesso restrito</h1>
            <p className="text-xs text-[#9A9A9A] mt-1">Informe a senha para acessar remotamente.</p>
          </div>
        </div>

        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha"
          className="w-full px-3 py-2.5 bg-[#1A1A1A] border border-[#3A3A3A] rounded-lg text-[#F5F5F5] text-sm outline-none focus:border-[#D97757] transition-colors"
        />

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading || password.length === 0}
          className="w-full px-3 py-2.5 bg-[#D97757] hover:bg-[#c96647] disabled:opacity-50 rounded-lg text-white text-sm font-medium transition-colors"
        >
          {loading ? 'Verificando...' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}

export default Login
