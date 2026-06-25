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
    <div className="min-h-screen bg-claude-bg flex items-center justify-center px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm bg-claude-surface rounded-2xl border border-claude-border p-6 flex flex-col gap-5"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-xl bg-claude-primary/10 border border-claude-primary/20 flex items-center justify-center">
            <Lock className="w-6 h-6 text-claude-primary" />
          </div>
          <div>
            <h1 className="text-claude-text font-semibold">Acesso restrito</h1>
            <p className="text-xs text-claude-muted mt-1">Informe a senha para acessar remotamente.</p>
          </div>
        </div>

        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha"
          className="w-full px-3 py-2.5 bg-claude-bg border border-claude-border rounded-lg text-claude-text text-sm outline-none focus:border-claude-primary transition-colors"
        />

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading || password.length === 0}
          className="w-full px-3 py-2.5 bg-claude-primary hover:bg-claude-primary-hover disabled:opacity-50 rounded-lg text-white text-sm font-medium transition-colors"
        >
          {loading ? 'Verificando...' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}

export default Login
