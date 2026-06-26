import { useEffect, useRef, useCallback, useState } from 'react'
import { MessageSquare, Menu, Search, Bell, BellOff, BellRing, Download, CheckSquare, Square, Trash2, GitBranch } from 'lucide-react'
import { Tooltip } from '../../../components/ui/Tooltip'
import MessageItem from './MessageItem'
import ChatInput from './ChatInput'
import ChatSearch from './ChatSearch'
import { usePrompts } from '../hooks/usePrompts'
import { useFileDrop } from '../hooks/useFileDrop'
import { useChatSearch } from '../hooks/useChatSearch'
import { useChatAlert } from '../hooks/useChatAlert'
import { useExportChat } from '../hooks/useExportChat'
import { useMultiSelect } from '../hooks/useMultiSelect'
import { useProjectsControllerFindById } from '../../../api/generated/api'
import type { ChatSessionsControllerFind200Item } from '../../../api/generated/models'

interface Props {
  session: ChatSessionsControllerFind200Item | null
  onOpenSidebar: () => void
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-claude-surface border border-claude-border flex items-center justify-center mb-4">
        <MessageSquare className="w-8 h-8 text-claude-muted" />
      </div>
      <h2 className="text-claude-text text-lg font-semibold mb-2">Selecione um chat</h2>
      <p className="text-claude-muted text-sm max-w-xs">
        Escolha um chat na sidebar ou crie um novo para começar a conversar.
      </p>
    </div>
  )
}

function NoSessionInput() {
  return (
    <div className="p-4 border-t border-claude-border">
      <div className="flex items-center gap-3 bg-claude-surface border border-claude-border rounded-2xl px-4 py-3 opacity-40 cursor-not-allowed">
        <span className="flex-1 text-claude-muted text-sm">Selecione um chat para começar...</span>
      </div>
    </div>
  )
}

interface AlertButtonProps {
  alertEnabled: boolean
  isAlarming: boolean
  onToggle: () => void
  onDismiss: () => void
}

function AlertButton({ alertEnabled, isAlarming, onToggle, onDismiss }: AlertButtonProps) {
  if (isAlarming) {
    return (
      <Tooltip text="Fila finalizada! Clique para parar" position="bottom" align="right">
        <button type="button" onClick={onDismiss} className="p-1.5 rounded-lg transition-colors text-amber-400 bg-amber-400/10 hover:bg-amber-400/20 animate-pulse">
          <BellRing className="w-4 h-4" />
        </button>
      </Tooltip>
    )
  }
  if (alertEnabled) {
    return (
      <Tooltip text="Alerta ativado — clique para desativar" position="bottom" align="right">
        <button type="button" onClick={onToggle} className="p-1.5 rounded-lg transition-colors text-claude-primary bg-claude-primary/10 hover:bg-claude-primary/20">
          <Bell className="w-4 h-4" />
        </button>
      </Tooltip>
    )
  }
  return (
    <Tooltip text="Ativar alerta ao fim da fila" position="bottom" align="right">
      <button type="button" onClick={onToggle} className="p-1.5 rounded-lg transition-colors text-claude-muted hover:text-claude-text hover:bg-claude-border">
        <BellOff className="w-4 h-4" />
      </button>
    </Tooltip>
  )
}

function HamburgerButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="md:hidden p-1.5 text-claude-muted hover:text-claude-text transition-colors mr-2">
      <Menu className="w-5 h-5" />
    </button>
  )
}

export default function ChatArea({ session, onOpenSidebar }: Props) {
  const { data: project } = useProjectsControllerFindById(session?.projectId ?? 0, {
    query: { enabled: !!session?.projectId },
  })
  const { prompts, sendPrompt, isSending, refetchPrompts, deletePrompt, deleteMultiple } = usePrompts(session)
  const { alertEnabled, toggleAlert, isAlarming, dismissAlarm } = useChatAlert(session?.chatName, prompts)
  const { exportAsMarkdown } = useExportChat(session?.chatName, prompts)
  const { selectMode, selectedIds, toggleSelectMode, toggleId, clearSelection } = useMultiSelect()
  const { isDragging, attachedFiles, addFiles, removeFile, clearFiles, handleDragOver, handleDragLeave, handleDrop } = useFileDrop()
  const [showSearch, setShowSearch] = useState(false)
  const hasGit = session?.hasGit ?? false
  const { query, setQuery, currentMatchId, currentIndex, totalMatches, goNext, goPrev } = useChatSearch(prompts)
  const bottomRef = useRef<HTMLDivElement>(null)

  const handleSend = useCallback(async (content: string, contextFiles: string[], claudeModel: string | null, waitForPromptId: number | null, useWaitResponse: boolean): Promise<void> => {
    await sendPrompt(content, contextFiles, claudeModel, waitForPromptId, useWaitResponse)
    clearFiles()
  }, [sendPrompt, clearFiles])

  const handleDeleteSelected = useCallback(async () => {
    await deleteMultiple(selectedIds)
    clearSelection()
  }, [deleteMultiple, selectedIds, clearSelection])

  const handleRetry = useCallback(async (content: string, contextFiles: string[]) => {
    await sendPrompt(content, contextFiles, null, null, false)
  }, [sendPrompt])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [prompts])

  useEffect(() => {
    if (currentMatchId === null) return
    const el = document.querySelector(`[data-prompt-id="${currentMatchId}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [currentMatchId])

  useEffect(() => { if (!showSearch) setQuery('') }, [showSearch, setQuery])

  const handleCloseSearch = () => { setShowSearch(false); setQuery('') }

  if (!session) {
    return (
      <div className="flex-1 flex flex-col bg-claude-bg min-w-0">
        <div className="px-4 py-3 border-b border-claude-border flex items-center md:hidden">
          <HamburgerButton onClick={onOpenSidebar} />
        </div>
        <EmptyState />
        <NoSessionInput />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-claude-bg min-h-0 min-w-0 relative" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
      {isDragging && (
        <div className="absolute inset-0 z-10 bg-claude-primary/10 border-2 border-dashed border-claude-primary rounded-lg pointer-events-none flex items-center justify-center">
          <p className="text-claude-primary text-sm font-medium">Solte para anexar arquivo</p>
        </div>
      )}

      <div className="px-4 py-3 border-b border-claude-border flex-shrink-0 flex items-center gap-2">
        <HamburgerButton onClick={onOpenSidebar} />
        <div className="min-w-0 flex-1">
          <h2 className="text-claude-text font-semibold text-sm truncate">{session.chatName}</h2>
          {project && <p className="text-claude-muted text-xs font-mono mt-0.5 truncate">{project.workDir}</p>}
        </div>
        <Tooltip text="Selecionar mensagens" position="bottom" align="right">
          <button type="button" onClick={toggleSelectMode}
            className={`p-1.5 rounded-lg transition-colors ${selectMode ? 'text-claude-primary bg-claude-primary/10' : 'text-claude-muted hover:text-claude-text hover:bg-claude-border'}`}>
            {selectMode ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
          </button>
        </Tooltip>
        <Tooltip text={hasGit ? 'Git disponível neste projeto' : 'Projeto sem git — diff não disponível'} position="bottom" align="right">
          <span className={`p-1.5 rounded-lg ${hasGit ? 'text-claude-primary' : 'text-claude-muted opacity-40'}`}>
            <GitBranch className="w-4 h-4" />
          </span>
        </Tooltip>
        <Tooltip text="Exportar como Markdown" position="bottom" align="right">
          <button type="button" onClick={exportAsMarkdown} disabled={!prompts.length}
            className="p-1.5 rounded-lg transition-colors text-claude-muted hover:text-claude-text hover:bg-claude-border disabled:opacity-30 disabled:cursor-not-allowed">
            <Download className="w-4 h-4" />
          </button>
        </Tooltip>
        <AlertButton alertEnabled={alertEnabled} isAlarming={isAlarming} onToggle={toggleAlert} onDismiss={dismissAlarm} />
        <button type="button" onClick={() => setShowSearch(v => !v)}
          className={`p-1.5 rounded-lg transition-colors ${showSearch ? 'text-claude-primary bg-claude-primary/10' : 'text-claude-muted hover:text-claude-text hover:bg-claude-border'}`}
          title="Buscar no chat (Ctrl+F)">
          <Search className="w-4 h-4" />
        </button>
      </div>

      {selectMode && selectedIds.size > 0 && (
        <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20 flex items-center gap-3 flex-shrink-0">
          <span className="text-red-400 text-xs flex-1">{selectedIds.size} selecionado{selectedIds.size > 1 ? 's' : ''}</span>
          <button type="button" onClick={handleDeleteSelected}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />Deletar
          </button>
          <button type="button" onClick={clearSelection} className="text-xs text-claude-muted hover:text-claude-text transition-colors">Cancelar</button>
        </div>
      )}

      {showSearch && (
        <ChatSearch query={query} onQueryChange={setQuery} totalMatches={totalMatches} currentIndex={currentIndex} onNext={goNext} onPrev={goPrev} onClose={handleCloseSearch} />
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {prompts.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <p className="text-claude-muted text-sm">Nenhuma mensagem ainda. Envie um prompt para começar.</p>
          </div>
        )}
        {prompts.map((prompt, index) => (
          <MessageItem
            key={prompt.id ?? index}
            prompt={prompt}
            onUpdated={refetchPrompts}
            onDelete={deletePrompt}
            onRetry={handleRetry}
            searchQuery={query}
            isCurrentMatch={prompt.id === currentMatchId}
            selectMode={selectMode}
            isSelected={selectedIds.has(prompt.id ?? -1)}
            onToggleSelect={toggleId}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      <ChatInput onSend={handleSend} disabled={isSending} attachedFiles={attachedFiles} onAttachFiles={addFiles} onRemoveFile={removeFile} currentChatName={session?.chatName ?? null} />
    </div>
  )
}
