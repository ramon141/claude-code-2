import { useEffect, useState, useCallback } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'

type DragDropPayload =
  | { type: 'enter'; paths: string[] }
  | { type: 'over'; paths?: string[] }
  | { type: 'drop'; paths: string[] }
  | { type: 'leave' }

export function useFileDrop() {
  const [isDragging, setIsDragging] = useState(false)
  const [attachedFiles, setAttachedFiles] = useState<string[]>([])

  useEffect(() => {
    let unlisten: (() => void) | null = null

    getCurrentWindow()
      .onDragDropEvent((event) => {
        const payload = event.payload as DragDropPayload
        if (payload.type === 'enter') {
          setIsDragging(true)
        } else if (payload.type === 'drop') {
          setIsDragging(false)
          if (payload.paths.length > 0) {
            setAttachedFiles((prev) => [...new Set([...prev, ...payload.paths])])
          }
        } else if (payload.type === 'leave') {
          setIsDragging(false)
        }
      })
      .then((u) => { unlisten = u })

    return () => { unlisten?.() }
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

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
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
