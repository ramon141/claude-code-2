import { useEffect } from 'react'
import { setupControllerStatus } from '../../../api/generated/api'

const RESTART_POLL_MS = 1500

// Enquanto a API reinicia para aplicar configurações, fica consultando /setup/status.
// Quando voltar a responder, recarrega a página para reconectar com a nova instância.
export function useRestartWatcher(active: boolean): void {
  useEffect(() => {
    if (!active) return
    const timer = setInterval(async () => {
      try {
        const status = await setupControllerStatus()
        if (status.completed) window.location.reload()
      } catch {
        // API reiniciando — segue tentando
      }
    }, RESTART_POLL_MS)
    return () => clearInterval(timer)
  }, [active])
}
