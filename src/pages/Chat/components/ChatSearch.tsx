import { useEffect, useRef } from 'react'
import { X, ChevronUp, ChevronDown } from 'lucide-react'

interface Props {
  query: string
  onQueryChange: (q: string) => void
  totalMatches: number
  currentIndex: number
  onNext: () => void
  onPrev: () => void
  onClose: () => void
}

export default function ChatSearch({
  query,
  onQueryChange,
  totalMatches,
  currentIndex,
  onNext,
  onPrev,
  onClose,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return }
    if (e.key === 'Enter') { e.shiftKey ? onPrev() : onNext() }
  }

  const counterText = query.trim()
    ? totalMatches === 0
      ? 'Sem resultados'
      : `${currentIndex + 1} de ${totalMatches}`
    : ''

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-claude-border bg-claude-surface">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={e => onQueryChange(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Buscar no chat..."
        className="flex-1 bg-claude-bg border border-claude-border rounded-lg px-3 py-1.5 text-sm text-claude-text placeholder:text-claude-muted focus:outline-none focus:border-claude-primary"
      />
      {counterText && (
        <span className="text-xs text-claude-muted whitespace-nowrap flex-shrink-0">{counterText}</span>
      )}
      <button
        type="button"
        onClick={onPrev}
        disabled={totalMatches === 0}
        className="p-1 rounded-md text-claude-muted hover:text-claude-text hover:bg-claude-border transition-colors disabled:opacity-30"
        title="Anterior (Shift+Enter)"
      >
        <ChevronUp className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={totalMatches === 0}
        className="p-1 rounded-md text-claude-muted hover:text-claude-text hover:bg-claude-border transition-colors disabled:opacity-30"
        title="Próximo (Enter)"
      >
        <ChevronDown className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={onClose}
        className="p-1 rounded-md text-claude-muted hover:text-claude-text hover:bg-claude-border transition-colors"
        title="Fechar (Esc)"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
