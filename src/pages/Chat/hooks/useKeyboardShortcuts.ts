import { useEffect, useCallback } from 'react'

interface ShortcutHandlers {
  onOpenSearch: () => void
  onNewChat: () => void
  onSelectByIndex: (index: number) => void
}

export function useKeyboardShortcuts({ onOpenSearch, onNewChat, onSelectByIndex }: ShortcutHandlers): void {
  const handle = useCallback((e: KeyboardEvent) => {
    if (!e.metaKey && !e.ctrlKey) return
    if (e.key === 'k') { e.preventDefault(); onOpenSearch(); return }
    if (e.key === 'n') { e.preventDefault(); onNewChat(); return }
    const digit = parseInt(e.key, 10)
    if (digit >= 1 && digit <= 9) { e.preventDefault(); onSelectByIndex(digit - 1) }
  }, [onOpenSearch, onNewChat, onSelectByIndex])

  useEffect(() => {
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [handle])
}
