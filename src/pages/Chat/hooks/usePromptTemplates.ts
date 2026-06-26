import { useState, useCallback } from 'react'

const STORAGE_KEY = 'prompt-templates'

export interface PromptTemplate {
  id: string
  name: string
  content: string
}

function loadTemplates(): PromptTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as PromptTemplate[]) : []
  } catch {
    return []
  }
}

function persist(templates: PromptTemplate[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
}

export function usePromptTemplates() {
  const [templates, setTemplates] = useState<PromptTemplate[]>(loadTemplates)

  const addTemplate = useCallback((name: string, content: string) => {
    setTemplates(prev => {
      const next = [...prev, { id: crypto.randomUUID(), name, content }]
      persist(next)
      return next
    })
  }, [])

  const deleteTemplate = useCallback((id: string) => {
    setTemplates(prev => {
      const next = prev.filter(t => t.id !== id)
      persist(next)
      return next
    })
  }, [])

  return { templates, addTemplate, deleteTemplate }
}
