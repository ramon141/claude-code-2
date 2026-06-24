import { useEffect, useRef } from 'react'
import { getWebSocketUrl } from '../../../api/apiConfig'

export type WsPromptStatus = 'queued' | 'executing' | 'completed' | 'failed' | 'cancelled' | 'rate_limited'

export interface WsPromptUpdate {
  event: 'prompt:updated'
  promptId: number
  status: WsPromptStatus
  output: string
}

const RECONNECT_DELAY_MS = 3000

export function useWebSocket(
  onUpdate: (data: WsPromptUpdate) => void,
  enabled: boolean
) {
  const handlerRef = useRef<(data: WsPromptUpdate) => void>(onUpdate)
  handlerRef.current = onUpdate

  useEffect(() => {
    if (!enabled) return

    let ws: WebSocket | null = null
    let cancelled = false

    function connect() {
      if (cancelled) return

      ws = new WebSocket(getWebSocketUrl())

      ws.onmessage = (event: MessageEvent<string>) => {
        const data = JSON.parse(event.data) as WsPromptUpdate
        if (data.event === 'prompt:updated') {
          handlerRef.current(data)
        }
      }

      ws.onclose = (e: CloseEvent) => {
        if (cancelled) return
        if (e.code === 4001 || e.code === 4003) return
        setTimeout(connect, RECONNECT_DELAY_MS)
      }
    }

    connect()

    return () => {
      cancelled = true
      ws?.close()
    }
  }, [enabled])
}
