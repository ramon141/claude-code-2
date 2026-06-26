import { useState, useEffect, useRef } from 'react'
import { useChatSessionsControllerSearch } from '../../../api/generated/api'
import type { ChatSessionsControllerSearch200Item } from '../../../api/generated/models'

const DEBOUNCE_MS = 300
const MIN_LENGTH = 2

export function useGlobalSearch() {
  const [inputValue, setInputValue] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleInput = (value: string) => {
    setInputValue(value)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (value.trim().length < MIN_LENGTH) {
      setDebouncedQuery('')
      return
    }
    timerRef.current = setTimeout(() => setDebouncedQuery(value.trim()), DEBOUNCE_MS)
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const { data: results = [], isFetching } = useChatSessionsControllerSearch(
    { q: debouncedQuery },
    { query: { enabled: debouncedQuery.length >= MIN_LENGTH } },
  )

  if (debouncedQuery.length >= MIN_LENGTH) {
    console.log('[useGlobalSearch] results:', JSON.stringify(results))
  }

  const clear = () => { setInputValue(''); setDebouncedQuery('') }

  const isSearching = inputValue.trim().length >= MIN_LENGTH

  return {
    inputValue,
    handleInput,
    results: results as ChatSessionsControllerSearch200Item[],
    isFetching,
    isSearching,
    clear,
  }
}
