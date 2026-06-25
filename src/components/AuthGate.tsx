import React, { useCallback, useEffect, useState } from 'react'
import type { AxiosError } from 'axios'
import { setupControllerStatus } from '../api/generated/api'
import Login from '../pages/Login'
import type { BaseComponentProps } from '../types'

const UNAUTHORIZED = 401

type GateState = 'checking' | 'authed' | 'login'

// Barreira de autenticação para acesso externo. No desktop (loopback) o probe
// passa sem token e segue direto. Via túnel (ngrok) sem senha válida, a API
// responde 401 e mostramos a tela de login. Erro de rede só re-tenta.
const AuthGate: React.FC<BaseComponentProps> = ({ children }) => {
  const [state, setState] = useState<GateState>('checking')

  const probe = useCallback(async () => {
    setState('checking')
    try {
      await setupControllerStatus()
      setState('authed')
    } catch (error) {
      const status = (error as AxiosError).response?.status
      if (status === UNAUTHORIZED) setState('login')
      else setTimeout(() => void probe(), 2000)
    }
  }, [])

  useEffect(() => { void probe() }, [probe])

  if (state === 'checking') return <LoadingScreen message="Conectando à API..." />
  if (state === 'login') return <Login onAuthenticated={() => setState('authed')} />

  return <>{children}</>
}

const LoadingScreen: React.FC<{ message: string }> = ({ message }) => (
  <div className="min-h-screen bg-claude-bg flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <span className="w-10 h-10 border-4 border-claude-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-claude-muted text-sm">{message}</p>
    </div>
  </div>
)

export default AuthGate
