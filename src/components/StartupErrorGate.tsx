import React, { useEffect, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import type { Event as TauriEvent } from '@tauri-apps/api/event'

async function listenIfTauri(
  event: string,
  handler: (payload: string) => void,
): Promise<(() => void) | null> {
  try {
    const mod = await import('@tauri-apps/api/event')
    const unlisten = await mod.listen<string>(event, (e: TauriEvent<string>) => handler(e.payload))
    return unlisten
  } catch {
    return null
  }
}

const StartupErrorGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fatalError, setFatalError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])

  useEffect(() => {
    const unlisteners: Array<() => void> = []

    listenIfTauri('startup-error', (msg) => setFatalError(msg)).then((u) => { if (u) unlisteners.push(u) })
    listenIfTauri('ngrok-warning', (msg) => setWarnings((w) => [...w, msg])).then((u) => { if (u) unlisteners.push(u) })

    return () => { unlisteners.forEach((u) => u()) }
  }, [])

  if (fatalError) return <ErrorScreen message={fatalError} />

  return (
    <>
      {warnings.map((w, i) => (
        <WarningBanner key={i} message={w} onDismiss={() => setWarnings((ws) => ws.filter((_, j) => j !== i))} />
      ))}
      {children}
    </>
  )
}

const WarningBanner: React.FC<{ message: string; onDismiss: () => void }> = ({ message, onDismiss }) => (
  <div className="fixed top-0 left-0 right-0 z-50 bg-orange-900/90 border-b border-orange-700 px-4 py-2 flex items-center gap-2 text-orange-200 text-sm">
    <AlertTriangle className="w-4 h-4 shrink-0" />
    <span className="flex-1">{message}</span>
    <button type="button" onClick={onDismiss} className="shrink-0 hover:text-white">
      <X className="w-4 h-4" />
    </button>
  </div>
)

const ErrorScreen: React.FC<{ message: string }> = ({ message }) => (
  <div className="min-h-screen bg-claude-bg flex items-center justify-center">
    <div className="flex flex-col items-center gap-4 max-w-sm text-center px-6">
      <AlertTriangle className="w-12 h-12 text-red-500" />
      <p className="text-claude-text font-semibold text-lg">Erro ao inicializar</p>
      <p className="text-claude-muted text-sm leading-relaxed">{message}</p>
    </div>
  </div>
)

export default StartupErrorGate
