import { useState, useRef, useEffect } from 'react'
import { CheckCircle, XCircle, Loader2, Clock, Ban, Gauge, Paperclip, Pencil, Check, X, Link, Trash2, RotateCcw } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { usePromptsControllerUpdateById } from '../../../api/generated/api'
import type { ChatSessionsControllerGetPrompts200Item } from '../../../api/generated/models'
import HighlightText from './HighlightText'
import DiffBlock from './DiffBlock'

interface Props {
  prompt: ChatSessionsControllerGetPrompts200Item
  onUpdated?: () => void
  onDelete?: (id: number) => void
  onRetry?: (content: string, contextFiles: string[]) => void
  searchQuery?: string
  isCurrentMatch?: boolean
  selectMode?: boolean
  isSelected?: boolean
  onToggleSelect?: (id: number) => void
}

type KnownStatus = 'draft' | 'queued' | 'executing' | 'completed' | 'failed' | 'cancelled' | 'rate_limited'

interface StatusConfig {
  icon: React.ReactNode
  label: string
  className: string
}

const STATUS_CONFIG: Record<KnownStatus, StatusConfig> = {
  draft: { icon: <Clock className="w-3.5 h-3.5" />, label: 'Rascunho', className: 'bg-claude-border/50 text-claude-muted border border-dashed border-claude-border' },
  queued: { icon: <Clock className="w-3.5 h-3.5" />, label: 'Na fila', className: 'bg-claude-border text-claude-muted' },
  executing: { icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />, label: 'Executando', className: 'bg-claude-primary/20 text-claude-primary' },
  completed: { icon: <CheckCircle className="w-3.5 h-3.5" />, label: 'Concluído', className: 'bg-green-500/20 text-green-400' },
  failed: { icon: <XCircle className="w-3.5 h-3.5" />, label: 'Falhou', className: 'bg-red-500/20 text-red-400' },
  cancelled: { icon: <Ban className="w-3.5 h-3.5" />, label: 'Cancelado', className: 'bg-claude-border text-claude-muted' },
  rate_limited: { icon: <Gauge className="w-3.5 h-3.5" />, label: 'Rate limit', className: 'bg-yellow-500/20 text-yellow-400' },
}

const KNOWN_STATUSES = new Set<string>(['draft', 'queued', 'executing', 'completed', 'failed', 'cancelled', 'rate_limited'])
const EDITABLE_STATUSES = new Set(['queued', 'rate_limited'])
const DELETABLE_STATUSES = new Set(['completed', 'failed', 'cancelled', 'rate_limited'])
const RETRYABLE_STATUSES = new Set(['failed', 'cancelled'])

function isKnownStatus(s: string): s is KnownStatus { return KNOWN_STATUSES.has(s) }
function isEditable(status?: string): boolean { return !!status && EDITABLE_STATUSES.has(status) }
function isDeletable(status?: string): boolean { return !!status && DELETABLE_STATUSES.has(status) }
function isRetryable(status?: string): boolean { return !!status && RETRYABLE_STATUSES.has(status) }

function StatusBadge({ status }: { status?: string }) {
  if (!status || !isKnownStatus(status)) return null
  const config = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}>
      {config.icon}
      {config.label}
    </span>
  )
}

function isActive(status?: string): boolean { return status === 'queued' || status === 'executing' }

function ContextFileTag({ path }: { path: string }) {
  const name = path.split('/').pop() ?? path
  return (
    <div className="inline-flex items-center gap-1 bg-claude-bg border border-claude-border rounded-md px-2 py-0.5 text-xs text-claude-muted" title={path}>
      <Paperclip className="w-2.5 h-2.5 flex-shrink-0" />
      <span className="truncate max-w-[160px]">{name}</span>
    </div>
  )
}

function EditableContent({ promptId, content, onCancel, onSaved }: { promptId: number; content: string; onCancel: () => void; onSaved: () => void }) {
  const [value, setValue] = useState(content)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { mutateAsync, isPending } = usePromptsControllerUpdateById()

  useEffect(() => {
    textareaRef.current?.focus()
    textareaRef.current?.setSelectionRange(value.length, value.length)
  }, [value.length])

  const save = async () => {
    if (value.trim() === content.trim()) { onCancel(); return }
    await mutateAsync({ id: promptId, data: { content: value.trim() } })
    onSaved()
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void save()
    if (e.key === 'Escape') onCancel()
  }

  return (
    <div className="space-y-2">
      <textarea ref={textareaRef} value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={handleKey}
        rows={Math.max(2, value.split('\n').length)}
        className="w-full bg-claude-bg border border-claude-primary/50 rounded-xl px-3 py-2 text-claude-text text-sm resize-none focus:outline-none focus:border-claude-primary" />
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-claude-muted hover:text-claude-text transition-colors">
          <X className="w-3.5 h-3.5" />Cancelar
        </button>
        <button type="button" onClick={() => void save()} disabled={isPending || !value.trim()}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-claude-primary/20 text-claude-primary hover:bg-claude-primary/30 transition-colors disabled:opacity-50">
          <Check className="w-3.5 h-3.5" />Salvar
        </button>
      </div>
    </div>
  )
}

function WaitingBadge({ waitForPromptId }: { waitForPromptId: number }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-claude-primary/10 text-claude-primary/70 border border-claude-primary/20">
      <Link className="w-3 h-3" />Aguardando #{waitForPromptId}
    </span>
  )
}

function PromptOutput({ output, highlight }: { output: string; highlight: boolean }) {
  return (
    <div className={`bg-claude-surface border rounded-2xl rounded-tl-sm px-4 py-3 transition-all ${highlight ? 'border-yellow-400/50 ring-1 ring-yellow-400/20' : 'border-claude-border'}`}>
      <div className="prose prose-invert prose-sm max-w-none
        prose-p:text-claude-text prose-p:leading-relaxed prose-p:my-1
        prose-headings:text-claude-text prose-headings:font-semibold
        prose-h1:text-lg prose-h2:text-base prose-h3:text-sm
        prose-strong:text-claude-text prose-em:text-claude-text-dim
        prose-code:text-claude-primary prose-code:bg-claude-bg prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
        prose-pre:bg-claude-bg prose-pre:border prose-pre:border-claude-border prose-pre:rounded-lg prose-pre:p-3 prose-pre:overflow-x-auto
        prose-pre:text-xs prose-pre:font-mono prose-pre:leading-relaxed
        prose-ul:text-claude-text prose-ul:my-1 prose-li:my-0.5
        prose-ol:text-claude-text prose-ol:my-1
        prose-blockquote:border-l-[#D97757] prose-blockquote:text-claude-muted prose-blockquote:my-2
        prose-hr:border-claude-border
        prose-a:text-claude-primary prose-a:no-underline hover:prose-a:underline
        prose-table:text-claude-text prose-th:border-claude-border prose-td:border-claude-border">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code(props) {
              const { className, children } = props
              const lang = (className ?? '').replace('language-', '')
              if (lang === 'diff') return <DiffBlock content={String(children)} />
              return <code className={className}>{children}</code>
            },
          }}
        >
          {output}
        </ReactMarkdown>
      </div>
    </div>
  )
}

export default function MessageItem({ prompt, onUpdated, onDelete, onRetry, searchQuery = '', isCurrentMatch = false, selectMode = false, isSelected = false, onToggleSelect }: Props) {
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const hasFiles = (prompt.contextFiles?.length ?? 0) > 0
  const canEdit = isEditable(prompt.status)
  const canDelete = isDeletable(prompt.status)
  const canRetry = isRetryable(prompt.status)
  const outputMatchesQuery = !!searchQuery.trim() && (prompt.output ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  const selectable = selectMode && canDelete

  const handleDeleteConfirm = () => { onDelete?.(prompt.id!); setConfirmDelete(false) }

  const bubbleBorder = isCurrentMatch
    ? 'border-yellow-400/70 ring-2 ring-yellow-400/30'
    : isSelected ? 'border-claude-primary ring-2 ring-claude-primary/30' : 'border-claude-primary/30'

  return (
    <div className="space-y-3" data-prompt-id={prompt.id}>
      <div className="flex justify-end items-center gap-2">
        <div className="max-w-[80%] space-y-2">
          {hasFiles && (
            <div className="flex flex-wrap gap-1 justify-end">
              {prompt.contextFiles!.map((path) => <ContextFileTag key={path} path={path} />)}
            </div>
          )}
          <div
            className={`group relative bg-claude-primary/20 border rounded-2xl rounded-tr-sm px-4 py-3 transition-all ${bubbleBorder} ${selectable ? 'cursor-pointer' : ''}`}
            onClick={selectable ? () => onToggleSelect?.(prompt.id!) : undefined}
          >
            {editing ? (
              <EditableContent promptId={prompt.id!} content={prompt.content ?? ''} onCancel={() => setEditing(false)} onSaved={() => { setEditing(false); onUpdated?.() }} />
            ) : confirmDelete ? (
              <div className="space-y-2">
                <p className="text-claude-text text-sm whitespace-pre-wrap">{prompt.content}</p>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <span className="text-xs text-red-400">Deletar este prompt?</span>
                  <button type="button" onClick={handleDeleteConfirm} className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">Sim</button>
                  <button type="button" onClick={() => setConfirmDelete(false)} className="text-xs px-2 py-0.5 rounded text-claude-muted hover:text-claude-text transition-colors">Não</button>
                </div>
              </div>
            ) : (
              <>
                <HighlightText text={prompt.content ?? ''} query={searchQuery} className="text-claude-text text-sm whitespace-pre-wrap" />
                {!selectMode && (
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    {canEdit && (
                      <button type="button" onClick={() => setEditing(true)} className="p-1 rounded-md text-claude-muted hover:text-claude-text hover:bg-claude-border transition-colors" title="Editar prompt">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {canRetry && (
                      <button type="button" onClick={() => onRetry?.(prompt.content ?? '', prompt.contextFiles ?? [])} className="p-1 rounded-md text-claude-muted hover:text-claude-primary hover:bg-claude-border transition-colors" title="Reenviar prompt">
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {canDelete && (
                      <button type="button" onClick={() => setConfirmDelete(true)} className="p-1 rounded-md text-claude-muted hover:text-red-400 hover:bg-claude-border transition-colors" title="Deletar prompt">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        {selectable && (
          <div
            className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer ${isSelected ? 'bg-claude-primary border-claude-primary' : 'border-claude-muted bg-claude-bg'}`}
            onClick={() => onToggleSelect?.(prompt.id!)}
          >
            {isSelected && <Check className="w-3 h-3 text-white" />}
          </div>
        )}
      </div>

      <div className="flex justify-start">
        <div className="max-w-[90%] space-y-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-6 h-6 rounded-full bg-claude-primary flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">C</span>
            </div>
            <StatusBadge status={prompt.status} />
            {prompt.waitForPromptId != null && prompt.status === 'queued' && (
              <WaitingBadge waitForPromptId={prompt.waitForPromptId} />
            )}
          </div>
          {prompt.output && <PromptOutput output={prompt.output} highlight={outputMatchesQuery} />}
          {prompt.diff && <DiffBlock content={prompt.diff} />}
          {isActive(prompt.status) && !prompt.output && (
            <div className="bg-claude-surface border border-claude-border rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-claude-muted animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-claude-muted animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-claude-muted animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
