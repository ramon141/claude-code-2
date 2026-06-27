import React from 'react'
import { useSetupControllerStatus } from '../api/generated/api'
import Setup from '../pages/Setup'
import type { BaseComponentProps } from '../types'
import { AlertTriangle, Loader2 } from 'lucide-react'

const REFETCH_INTERVAL_MS = 5_000

const SetupGate: React.FC<BaseComponentProps> = ({ children }) => {
  const { data, isLoading, isError } = useSetupControllerStatus({
    query: { retry: true, refetchOnWindowFocus: false, refetchInterval: REFETCH_INTERVAL_MS },
  })

  if (isLoading) return <LoadingScreen message="Carregando..." />
  if (isError) return <LoadingScreen message="Conectando à API..." />
  if (!data?.completed) return <Setup />
  if (!data?.databaseConnected) return <DatabaseErrorScreen />

  return (
    <>
      {data?.queueReady === false && <QueueNotReadyBanner />}
      {children}
    </>
  )
}

const LoadingScreen: React.FC<{ message: string }> = ({ message }) => (
  <div className="min-h-screen bg-claude-bg flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <span className="w-10 h-10 border-4 border-claude-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-claude-muted text-sm">{message}</p>
    </div>
  </div>
)

const QueueNotReadyBanner: React.FC = () => (
  <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-900/90 border-b border-yellow-700 px-4 py-2 flex items-center gap-2 text-yellow-200 text-sm">
    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
    <span>Fila de execução inicializando — aguarde antes de executar prompts.</span>
  </div>
)

const DatabaseErrorScreen: React.FC = () => (
  <div className="min-h-screen bg-claude-bg flex items-center justify-center">
    <div className="flex flex-col items-center gap-4 max-w-sm text-center">
      <AlertTriangle className="w-10 h-10 text-yellow-500" />
      <p className="text-claude-text font-medium">Banco de dados indisponível</p>
      <p className="text-claude-muted text-sm">
        Não foi possível conectar ao PostgreSQL. Verifique se o banco está rodando e aguarde — o app vai tentar reconectar automaticamente.
      </p>
      <span className="w-5 h-5 border-2 border-claude-primary border-t-transparent rounded-full animate-spin mt-2" />
    </div>
  </div>
)

export default SetupGate
