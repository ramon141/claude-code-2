import { Search, X, Loader2, MessageSquare } from 'lucide-react'
import { cn } from '../../../lib/utils'
import type { ChatSessionsControllerSearch200Item } from '../../../api/generated/models'
import { ChatSessionsControllerSearch200ItemMatchedInItem } from '../../../api/generated/models'

const MATCH_LABEL: Record<string, string> = {
  [ChatSessionsControllerSearch200ItemMatchedInItem.chatName]: 'Título',
  [ChatSessionsControllerSearch200ItemMatchedInItem.content]: 'Prompt',
  [ChatSessionsControllerSearch200ItemMatchedInItem.output]: 'Resposta',
}

const MATCH_CLASS: Record<string, string> = {
  [ChatSessionsControllerSearch200ItemMatchedInItem.chatName]: 'bg-claude-primary/15 text-claude-primary',
  [ChatSessionsControllerSearch200ItemMatchedInItem.content]: 'bg-blue-500/15 text-blue-400',
  [ChatSessionsControllerSearch200ItemMatchedInItem.output]: 'bg-green-500/15 text-green-400',
}

interface Props {
  inputValue: string
  onInputChange: (v: string) => void
  results: ChatSessionsControllerSearch200Item[]
  isFetching: boolean
  isSearching: boolean
  onSelect: (result: ChatSessionsControllerSearch200Item) => void
  onClear: () => void
}

function MatchChip({ type }: { type: string }) {
  return (
    <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0', MATCH_CLASS[type] ?? 'bg-claude-border text-claude-muted')}>
      {MATCH_LABEL[type] ?? type}
    </span>
  )
}

export default function GlobalSearch({ inputValue, onInputChange, results, isFetching, isSearching, onSelect, onClear }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-claude-muted pointer-events-none" />
        <input
          type="text"
          value={inputValue}
          onChange={e => onInputChange(e.target.value)}
          placeholder="Buscar em todos os chats..."
          className="w-full bg-claude-bg border border-claude-border rounded-xl pl-8 pr-7 py-2 text-sm text-claude-text placeholder:text-claude-muted focus:outline-none focus:border-claude-primary transition-colors"
        />
        {inputValue && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-claude-muted hover:text-claude-text transition-colors"
          >
            {isFetching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {isSearching && (
        <div className="flex flex-col gap-0.5 max-h-72 overflow-y-auto">
          {results.length === 0 && !isFetching && (
            <p className="text-claude-muted text-xs text-center py-4">Nenhum resultado</p>
          )}
          {results.map(result => (
            <button
              key={result.chatName}
              type="button"
              onClick={() => onSelect(result)}
              className="flex flex-col gap-1.5 w-full px-3 py-2 rounded-xl text-left hover:bg-white/6 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <MessageSquare className="w-3.5 h-3.5 text-claude-muted flex-shrink-0" />
                <span className="text-claude-text text-sm truncate flex-1">{result.chatName}</span>
              </div>
              <div className="flex flex-wrap gap-1 pl-5">
                {(result.matchedIn ?? []).map(m => <MatchChip key={m} type={m} />)}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
