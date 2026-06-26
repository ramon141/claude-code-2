import { useState, useCallback } from 'react'

export function useMultiSelect() {
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<number>>(new Set())

  const toggleSelectMode = useCallback(() => {
    setSelectMode(v => !v)
    setSelectedIds(new Set())
  }, [])

  const toggleId = useCallback((id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
    setSelectMode(false)
  }, [])

  return { selectMode, selectedIds, toggleSelectMode, toggleId, clearSelection }
}
