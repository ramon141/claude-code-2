import { useEffect, useRef } from 'react'
import { Clock, Loader2, Gauge, Link, X } from 'lucide-react'
import { usePromptsControllerFind } from '../../../api/generated/api'
import type { Prompt } from '../../../api/generated/models'

const PENDING_STATUSES = ['queued', 'executing', 'rate_limited'] as const
const PENDING_STATUS_PARAM = PENDING_STATUSES.join(',')
const STATUS_ICONS: Record<string, React.ReactNode> = {
  queued: <Clock className="w-3 h-3" />,
  executing: <Loader2 className="w-3 h-3 animate-spin" />,
  rate_limited: <Gauge className="w-3 h-3" />,
}

const CONTENT_PREVIEW_LEN = 60

function promptPreview(content?: string): string {
  if (!content) return ''
  return content.length > CONTENT_PREVIEW_LEN ? `${content.substring(0, CONTENT_PREVIEW_LEN)}…` : content
}

interface PromptOption {
  id: number
  chatName: string
  content: string
  status: string
}

function groupByChat(prompts: Prompt[]): Map<string, PromptOption[]> {
  const map = new Map<string, PromptOption[]>()
  for (const p of prompts) {
    const chat = p.chatName ?? 'sem chat'
    if (!map.has(chat)) map.set(chat, [])
    map.get(chat)!.push({
      id: p.id!,
      chatName: chat,
      content: p.content ?? '',
      status: p.status ?? '',
    })
  }
  return map
}

interface Props {
  currentChatName: string | null
  selected: number | null
  useWaitResponse: boolean
  onSelect: (id: number | null, chatName: string | null) => void
  onClose: () => void
}

export default function WaitForDropdown({ currentChatName, selected, useWaitResponse, onSelect, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  const { data: allPrompts = [] } = usePromptsControllerFind(
    { status: PENDING_STATUS_PARAM, limit: 200 },
    { query: { refetchInterval: 5000 } },
  )

  const pending = allPrompts.filter(
    p => p.chatName !== currentChatName && p.chatName != null,
  )

  const groups = groupByChat(pending)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute bottom-full left-0 mb-2 w-80 bg-claude-surface border border-claude-border rounded-xl shadow-xl z-20 overflow-hidden"
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-claude-border">
        <span className="text-claude-text text-xs font-medium flex items-center gap-1.5">
          <Link className="w-3.5 h-3.5 text-claude-primary" />
          Aguardar prompt de outro chat
        </span>
        <button type="button" onClick={onClose} className="text-claude-muted hover:text-claude-text">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="max-h-64 overflow-y-auto">
        {groups.size === 0 ? (
          <p className="text-claude-muted text-xs text-center py-6">Nenhum prompt ativo em outros chats</p>
        ) : (
          Array.from(groups.entries()).map(([chatName, options]) => (
            <div key={chatName}>
              <p className="px-3 pt-2 pb-1 text-claude-muted text-[10px] uppercase tracking-wider font-medium">
                {chatName}
              </p>
              {options.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => { onSelect(opt.id, opt.chatName); onClose() }}
                  className={`w-full text-left px-3 py-2 hover:bg-claude-border transition-colors flex items-start gap-2 ${selected === opt.id ? 'bg-claude-primary/10' : ''}`}
                >
                  <span className="flex-shrink-0 mt-0.5 text-claude-muted">{STATUS_ICONS[opt.status] ?? <Clock className="w-3 h-3" />}</span>
                  <span className="flex-1 text-claude-text text-xs leading-relaxed">{promptPreview(opt.content)}</span>
                </button>
              ))}
            </div>
          ))
        )}
      </div>

      {selected != null && (
        <div className="px-3 py-2 border-t border-claude-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-claude-primary text-xs">Selecionado: #{selected}</span>
            <button
              type="button"
              onClick={() => onSelect(null, null)}
              className="text-claude-muted hover:text-claude-text text-xs"
            >
              Limpar
            </button>
          </div>
          {useWaitResponse && (
            <p className="text-claude-muted text-[11px] leading-relaxed">
              Use <code className="text-claude-primary bg-claude-bg px-1 rounded">{'{{resposta}}'}</code> no texto para inserir a resposta. Se omitido, ela é adicionada ao final.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
