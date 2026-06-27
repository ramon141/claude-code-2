import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, GitFork, Play, Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'react-toastify'
import { usePromptsControllerFind, usePromptsControllerExecuteDrafts, usePromptsControllerDeleteById } from '../../api/generated/api'
import PipelineView from '../Chat/components/PipelineView'
import { Switch } from '../../components/ui/Switch'
import CreatePromptModal from './CreatePromptModal'
import PipelineContextMenu from './PipelineContextMenu'
import type { ContextMenuAction } from './PipelineContextMenu'
import PromptEditModal from './PromptEditModal'
import type { Prompt } from '../../api/generated/models'

const ALL_STATUSES = 'draft,queued,executing,rate_limited,completed,failed,cancelled'
const ACTIVE_STATUSES = 'draft,queued,executing,rate_limited'
const REFETCH_INTERVAL = 5000
const PROMPT_LIMIT = 300

interface ContextMenuState { x: number; y: number; actions: ContextMenuAction[] }

function DraftBadge({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-white text-[10px] font-bold ml-0.5">
      {count}
    </span>
  )
}

export default function GlobalPipeline() {
  const navigate = useNavigate()
  const [showAll, setShowAll] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [editPrompt, setEditPrompt] = useState<Prompt | null>(null)
  const lastClickTime = useRef(0)

  const { data: prompts = [], refetch } = usePromptsControllerFind(
    { status: showAll ? ALL_STATUSES : ACTIVE_STATUSES, limit: PROMPT_LIMIT },
    { query: { refetchInterval: REFETCH_INTERVAL } },
  )

  const { mutateAsync: executeDrafts, isLoading: isExecuting } = usePromptsControllerExecuteDrafts()
  const { mutateAsync: deletePrompt } = usePromptsControllerDeleteById()

  const draftCount = prompts.filter(p => p.status === 'draft').length

  const handleExecute = async () => {
    const result = await executeDrafts()
    const count = result.queued ?? 0
    if (count === 0) {
      toast.info('Nenhum rascunho para executar.')
    } else {
      toast.success(`${count} prompt${count > 1 ? 's' : ''} enfileirado${count > 1 ? 's' : ''}!`)
    }
    void refetch()
  }

  const closeContextMenu = useCallback(() => setContextMenu(null), [])

  const handleNodeClick = useCallback((prompt: Prompt) => {
    setContextMenu(null)
    const now = Date.now()
    if (now - lastClickTime.current < 300) return
    lastClickTime.current = now
    setEditPrompt(prompt)
  }, [])

  const handleNodeContextMenu = useCallback((prompt: Prompt, x: number, y: number) => {
    const actions: ContextMenuAction[] = [
      {
        label: 'Editar',
        icon: Pencil,
        onClick: () => setEditPrompt(prompt),
      },
      {
        label: 'Deletar',
        icon: Trash2,
        danger: true,
        onClick: async () => {
          if (prompt.id == null) return
          await deletePrompt({ id: prompt.id })
          void refetch()
        },
      },
    ]
    setContextMenu({ x, y, actions })
  }, [deletePrompt, refetch])

  const handlePaneContextMenu = useCallback((e: React.MouseEvent | MouseEvent) => {
    e.preventDefault()
    const actions: ContextMenuAction[] = [
      { label: 'Novo Prompt', icon: Plus, onClick: () => setShowModal(true) },
    ]
    setContextMenu({ x: e.clientX, y: e.clientY, actions })
  }, [])

  return (
    <div className="flex flex-col h-screen bg-claude-bg">
      <div className="flex-shrink-0 px-4 py-3 border-b border-claude-border flex items-center gap-3">
        <button type="button" onClick={() => navigate('/')}
          className="p-1.5 text-claude-muted hover:text-claude-text transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <GitFork className="w-4 h-4 text-claude-primary" />
        <h1 className="text-claude-text font-semibold text-sm">Pipeline Global</h1>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <Switch checked={showAll} onChange={setShowAll} label="Mostrar todos" />
          <span className="text-claude-muted text-xs">Mostrar todos</span>
        </div>

        <span className="text-claude-muted text-xs">{prompts.length} prompts</span>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 border border-claude-border rounded-lg text-claude-muted hover:text-claude-text hover:border-claude-text/30 text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Prompt
        </button>

        <button
          type="button"
          onClick={() => void handleExecute()}
          disabled={isExecuting || draftCount === 0}
          className="flex items-center gap-1.5 px-4 py-2 bg-claude-primary hover:bg-claude-primary/80 rounded-lg text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Play className="w-4 h-4" />
          Executar
          <DraftBadge count={draftCount} />
        </button>
      </div>

      <div className="flex-1 min-h-0 flex">
        <PipelineView
          prompts={prompts}
          onUpdated={() => void refetch()}
          onNodeClick={handleNodeClick}
          onNodeContextMenu={handleNodeContextMenu}
          onPaneClick={closeContextMenu}
          onPaneContextMenu={handlePaneContextMenu}
        />
      </div>

      {contextMenu && (
        <PipelineContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          actions={contextMenu.actions}
          onClose={() => setContextMenu(null)}
        />
      )}

      {editPrompt && (
        <PromptEditModal
          prompt={editPrompt}
          onClose={() => setEditPrompt(null)}
          onUpdated={() => void refetch()}
        />
      )}

      {showModal && (
        <CreatePromptModal
          onClose={() => setShowModal(false)}
          onCreated={() => void refetch()}
        />
      )}
    </div>
  )
}
