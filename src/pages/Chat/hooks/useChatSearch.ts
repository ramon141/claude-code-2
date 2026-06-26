import { useState, useMemo, useCallback } from 'react'
import type { ChatSessionsControllerGetPrompts200Item } from '../../../api/generated/models'

function matchesQuery(prompt: ChatSessionsControllerGetPrompts200Item, query: string): boolean {
  const q = query.toLowerCase()
  return (
    (prompt.content ?? '').toLowerCase().includes(q) ||
    (prompt.output ?? '').toLowerCase().includes(q)
  )
}

export function useChatSearch(prompts: ChatSessionsControllerGetPrompts200Item[]) {
  const [query, setQuery] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)

  const matchedIds = useMemo<Set<number>>(() => {
    if (!query.trim()) return new Set()
    return new Set(
      prompts
        .filter(p => matchesQuery(p, query.trim()))
        .map(p => p.id!)
    )
  }, [prompts, query])

  const matchedIdList = useMemo(
    () => prompts.filter(p => matchedIds.has(p.id!)).map(p => p.id!),
    [prompts, matchedIds]
  )

  const totalMatches = matchedIdList.length

  const safeIndex = totalMatches === 0 ? 0 : Math.min(currentIndex, totalMatches - 1)

  const currentMatchId = matchedIdList[safeIndex] ?? null

  const goNext = useCallback(() => {
    setCurrentIndex(i => (totalMatches === 0 ? 0 : (i + 1) % totalMatches))
  }, [totalMatches])

  const goPrev = useCallback(() => {
    setCurrentIndex(i => (totalMatches === 0 ? 0 : (i - 1 + totalMatches) % totalMatches))
  }, [totalMatches])

  const handleSetQuery = useCallback((q: string) => {
    setQuery(q)
    setCurrentIndex(0)
  }, [])

  return {
    query,
    setQuery: handleSetQuery,
    matchedIds,
    currentMatchId,
    currentIndex: safeIndex,
    totalMatches,
    goNext,
    goPrev,
  }
}
