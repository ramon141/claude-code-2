import { useEffect, useRef, useCallback } from 'react'
import { MessageSquare, Menu } from 'lucide-react'
import MessageItem from './MessageItem'
import ChatInput from './ChatInput'
import { usePrompts } from '../hooks/usePrompts'
import { useFileDrop } from '../hooks/useFileDrop'
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

function HamburgerButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="md:hidden p-1.5 text-claude-muted hover:text-claude-text transition-colors mr-2"
    >
      <Menu className="w-5 h-5" />
    </button>
  )
}

export default function ChatArea({ session, onOpenSidebar }: Props) {
  const { data: project } = useProjectsControllerFindById(session?.projectId ?? 0, {
    query: { enabled: !!session?.projectId },
  })
  const { prompts, sendPrompt, isSending, refetchPrompts } = usePrompts(session)
  const {
    isDragging,
    attachedFiles,
    addFiles,
    removeFile,
    clearFiles,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  } = useFileDrop()
  const bottomRef = useRef<HTMLDivElement>(null)

  const handleSend = useCallback(async (content: string, contextFiles: string[], claudeModel: string | null, waitForPromptId: number | null, useWaitResponse: boolean): Promise<void> => {
    await sendPrompt(content, contextFiles, claudeModel, waitForPromptId, useWaitResponse)
    clearFiles()
  }, [sendPrompt, clearFiles])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [prompts])

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
    <div
      className="flex-1 flex flex-col bg-claude-bg min-h-0 min-w-0 relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 z-10 bg-claude-primary/10 border-2 border-dashed border-claude-primary rounded-lg pointer-events-none flex items-center justify-center">
          <p className="text-claude-primary text-sm font-medium">Solte para anexar arquivo</p>
        </div>
      )}

      <div className="px-4 py-3 border-b border-claude-border flex-shrink-0 flex items-center">
        <HamburgerButton onClick={onOpenSidebar} />
        <div className="min-w-0">
          <h2 className="text-claude-text font-semibold text-sm truncate">{session.chatName}</h2>
          {project && (
            <p className="text-claude-muted text-xs font-mono mt-0.5 truncate">{project.workDir}</p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {prompts.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <p className="text-claude-muted text-sm">Nenhuma mensagem ainda. Envie um prompt para começar.</p>
          </div>
        )}
        {prompts.map((prompt, index) => (
          <MessageItem key={prompt.id ?? index} prompt={prompt} onUpdated={refetchPrompts} />
        ))}
        <div ref={bottomRef} />
      </div>

      <ChatInput
        onSend={handleSend}
        disabled={isSending}
        attachedFiles={attachedFiles}
        onAttachFiles={addFiles}
        onRemoveFile={removeFile}
        currentChatName={session?.chatName ?? null}
      />
    </div>
  )
}
