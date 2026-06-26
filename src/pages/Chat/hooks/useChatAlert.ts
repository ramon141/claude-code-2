import { useState, useEffect, useRef, useCallback } from 'react'
import { useAlarmSound } from './useAlarmSound'
import type { ChatSessionsControllerGetPrompts200Item } from '../../../api/generated/models'

const PENDING_STATUSES = new Set(['queued', 'executing'])
const STORAGE_KEY_PREFIX = 'chat-alert-'

function hasAnyPending(prompts: ChatSessionsControllerGetPrompts200Item[]): boolean {
  return prompts.some(p => PENDING_STATUSES.has(p.status ?? ''))
}

function loadAlertEnabled(chatName: string): boolean {
  return localStorage.getItem(`${STORAGE_KEY_PREFIX}${chatName}`) === 'true'
}

export function useChatAlert(
  chatName: string | undefined,
  prompts: ChatSessionsControllerGetPrompts200Item[],
) {
  const [alertEnabled, setAlertEnabled] = useState(false)
  const { startAlarm, stopAlarm, isPlaying } = useAlarmSound()
  const prevHadPendingRef = useRef(false)

  useEffect(() => {
    prevHadPendingRef.current = false
    stopAlarm()
    if (!chatName) { setAlertEnabled(false); return }
    setAlertEnabled(loadAlertEnabled(chatName))
  }, [chatName, stopAlarm])

  useEffect(() => {
    if (!chatName) return
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${chatName}`, String(alertEnabled))
    if (!alertEnabled) stopAlarm()
  }, [alertEnabled, chatName, stopAlarm])

  useEffect(() => {
    const nowPending = hasAnyPending(prompts)
    if (prevHadPendingRef.current && !nowPending && alertEnabled && prompts.length > 0) {
      startAlarm()
    }
    prevHadPendingRef.current = nowPending
  }, [prompts, alertEnabled, startAlarm])

  const toggleAlert = useCallback(() => setAlertEnabled(v => !v), [])
  const dismissAlarm = useCallback(() => stopAlarm(), [stopAlarm])

  return { alertEnabled, toggleAlert, isAlarming: isPlaying, dismissAlarm }
}
