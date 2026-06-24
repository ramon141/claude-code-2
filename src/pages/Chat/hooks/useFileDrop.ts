import { useState, useCallback } from 'react'

function extractPaths(e: DragEvent | React.DragEvent): string[] {
  const uriList = (e.dataTransfer as DataTransfer).getData('text/uri-list')
  if (uriList.trim()) {
    const paths = uriList
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'))
      .map((uri) => {
        const decoded = decodeURIComponent(uri)
        return decoded.startsWith('file://') ? decoded.slice(7) : decoded
      })
    if (paths.length > 0) return paths
  }

  const plain = (e.dataTransfer as DataTransfer).getData('text/plain')
  if (plain.trim()) return [plain.trim()]

  const files = Array.from((e.dataTransfer as DataTransfer).files)
  return files.map((f) => f.name)
}

export function useFileDrop() {
  const [isDragging, setIsDragging] = useState(false)
  const [injectedText, setInjectedText] = useState<string | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const paths = extractPaths(e)
    if (paths.length === 0) return
    setInjectedText(paths.join(' '))
  }, [])

  const consumeInjected = useCallback(() => {
    setInjectedText(null)
  }, [])

  return { isDragging, injectedText, consumeInjected, handleDragOver, handleDragLeave, handleDrop }
}
