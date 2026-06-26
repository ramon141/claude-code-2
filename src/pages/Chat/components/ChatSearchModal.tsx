import { useEffect, useRef } from 'react'
import { Search, X, MessageSquare, Loader2 } from 'lucide-react'
import { useGlobalSearch } from '../hooks/useGlobalSearch'
import type { ChatSessionsControllerFind200Item, ChatSessionsControllerSearch200Item } from '../../../api/generated/models'

const DATE_GROUP_ORDER = ['Hoje', 'Ontem', '7 dias anteriores', '30 dias anteriores', 'Mais antigos']

function getDateGroup(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Mais antigos'
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
  if (diff < 1) return 'Hoje'
  if (diff < 2) return 'Ontem'
  if (diff <= 7) return '7 dias anteriores'
  if (diff <= 30) return '30 dias anteriores'
  return 'Mais antigos'
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR', {day: 'numeric', month: 'short'})
}

function groupSessions(sessions: ChatSessionsControllerFind200Item[]) {
  const map = new Map<string, ChatSessionsControllerFind200Item[]>()
  for (const s of sessions) {
    const group = getDateGroup(s.lastUsed ?? s.createdAt)
    if (!map.has(group)) map.set(group, [])
    map.get(group)!.push(s)
  }
  return DATE_GROUP_ORDER.filter(g => map.has(g)).map(g => ({label: g, items: map.get(g)!}))
}

function SnippetText({text, query}: {text: string; query: string}) {
  if (!text || !query) return null
  const lower = text.toLowerCase()
  const qLower = query.toLowerCase()
  const pos = lower.indexOf(qLower)
  if (pos === -1) return <span className="text-claude-muted text-xs truncate">{text}</span>
  const before = text.slice(0, pos)
  const match = text.slice(pos, pos + query.length)
  const after = text.slice(pos + query.length)
  return (
    <span className="text-claude-muted text-xs line-clamp-1">
      {before}<strong className="text-claude-text font-semibold">{match}</strong>{after}
    </span>
  )
}

interface Props {
  sessions: ChatSessionsControllerFind200Item[]
  onSelect: (chatName: string) => void
  onClose: () => void
}

export default function ChatSearchModal({sessions, onSelect, onClose}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const {inputValue, handleInput, results, isFetching, isSearching, clear} = useGlobalSearch()

  useEffect(() => { inputRef.current?.focus() }, [])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleSelect = (chatName: string) => { clear(); onSelect(chatName); onClose() }
  const grouped = groupSessions(sessions)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" aria-hidden="true" />
      <div
        className="relative w-full max-w-xl bg-[#1e1e1e] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-white/10"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/8">
          <Search className="w-4 h-4 text-claude-muted flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={e => handleInput(e.target.value)}
            placeholder="Buscar em chats..."
            className="flex-1 bg-transparent text-claude-text placeholder:text-claude-muted text-sm focus:outline-none"
          />
          {isFetching
            ? <Loader2 className="w-4 h-4 text-claude-muted animate-spin flex-shrink-0" />
            : <button type="button" onClick={onClose} className="p-1 text-claude-muted hover:text-claude-text transition-colors flex-shrink-0"><X className="w-4 h-4" /></button>
          }
        </div>

        <div className="overflow-y-auto max-h-[65vh]">
          {isSearching
            ? <SearchResults results={results} query={inputValue} onSelect={handleSelect} />
            : <DefaultList grouped={grouped} onSelect={handleSelect} />
          }
        </div>
      </div>
    </div>
  )
}

interface DefaultListProps {
  grouped: {label: string; items: ChatSessionsControllerFind200Item[]}[]
  onSelect: (chatName: string) => void
}

function DefaultList({grouped, onSelect}: DefaultListProps) {
  if (grouped.length === 0) return <p className="text-claude-muted text-sm text-center py-8">Nenhum chat ainda.</p>
  return (
    <div className="py-1">
      {grouped.map(({label, items}) => (
        <div key={label}>
          <p className="px-4 pt-3 pb-1 text-xs text-claude-muted font-semibold">{label}</p>
          {items.map(s => (
            <button key={s.id} type="button" onClick={() => onSelect(s.chatName ?? '')}
              className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-white/6 transition-colors text-left">
              <MessageSquare className="w-4 h-4 text-claude-muted flex-shrink-0" />
              <span className="text-claude-text text-sm truncate flex-1">{s.chatName}</span>
              <span className="text-claude-muted text-xs flex-shrink-0">{formatDate(s.lastUsed ?? s.createdAt)}</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}

interface SearchResultsProps {
  results: ChatSessionsControllerSearch200Item[]
  query: string
  onSelect: (chatName: string) => void
}

function getSnippetFallback(r: ChatSessionsControllerSearch200Item): string {
  const matched = r.matchedIn ?? []
  if (matched.includes('content')) return 'Encontrado em uma mensagem sua'
  if (matched.includes('output')) return 'Encontrado em uma resposta do bot'
  return ''
}

function SearchResults({results, query, onSelect}: SearchResultsProps) {
  if (results.length === 0) return <p className="text-claude-muted text-sm text-center py-8">Nenhum resultado encontrado.</p>
  return (
    <div className="py-1">
      {results.map(r => {
        const snippetText = r.snippet || getSnippetFallback(r)
        return (
          <button key={r.chatName} type="button" onClick={() => onSelect(r.chatName ?? '')}
            className="flex items-start gap-3 w-full px-4 py-3 hover:bg-white/6 transition-colors text-left">
            <MessageSquare className="w-4 h-4 text-claude-muted flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <span className="block text-claude-text text-sm font-medium truncate">{r.chatName}</span>
              {snippetText && <SnippetText text={snippetText} query={query} />}
            </div>
          </button>
        )
      })}
    </div>
  )
}
