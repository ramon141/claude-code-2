import { useState, useCallback } from 'react'

function extractPaths(e: React.DragEvent): string[] {
  const uriList = e.dataTransfer.getData('text/uri-list')
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

  const plain = e.dataTransfer.getData('text/plain')
  if (plain.trim()) return [plain.trim()]

  return Array.from(e.dataTransfer.files).map((f) => f.name)
}

export function useFileDrop() {
  const [isDragging, setIsDragging] = useState(false)
  const [attachedFiles, setAttachedFiles] = useState<string[]>([])

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
    setAttachedFiles((prev) => [...new Set([...prev, ...paths])])
  }, [])

  const addFiles = useCallback((paths: string[]) => {
    setAttachedFiles((prev) => [...new Set([...prev, ...paths])])
  }, [])

  const removeFile = useCallback((path: string) => {
    setAttachedFiles((prev) => prev.filter((p) => p !== path))
  }, [])

  const clearFiles = useCallback(() => {
    setAttachedFiles([])
  }, [])

  return {
    isDragging,
    attachedFiles,
    addFiles,
    removeFile,
    clearFiles,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  }
}
