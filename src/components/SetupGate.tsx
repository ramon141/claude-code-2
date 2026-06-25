import React from 'react'
import { useSetupControllerStatus } from '../api/generated/api'
import Setup from '../pages/Setup'
import type { BaseComponentProps } from '../types'

const SetupGate: React.FC<BaseComponentProps> = ({ children }) => {
  const { data, isLoading, isError } = useSetupControllerStatus({
    query: { retry: true, refetchOnWindowFocus: false },
  })

  if (isLoading) return <LoadingScreen message="Carregando..." />
  if (isError) return <LoadingScreen message="Conectando à API..." />
  if (!data?.completed) return <Setup />

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

export default SetupGate
