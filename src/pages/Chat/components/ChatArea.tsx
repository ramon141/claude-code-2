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
      <div className="w-16 h-16 rounded-2xl bg-[#2A2A2A] border border-[#3A3A3A] flex items-center justify-center mb-4">
        <MessageSquare className="w-8 h-8 text-[#9A9A9A]" />
      </div>
      <h2 className="text-[#F5F5F5] text-lg font-semibold mb-2">Selecione um chat</h2>
      <p className="text-[#9A9A9A] text-sm max-w-xs">
        Escolha um chat na sidebar ou crie um novo para começar a conversar.
      </p>
    </div>
  )
}

function NoSessionInput() {
  return (
    <div className="p-4 border-t border-[#3A3A3A]">
      <div className="flex items-center gap-3 bg-[#2A2A2A] border border-[#3A3A3A] rounded-2xl px-4 py-3 opacity-40 cursor-not-allowed">
        <span className="flex-1 text-[#9A9A9A] text-sm">Selecione um chat para começar...</span>
      </div>
    </div>
  )
}

function HamburgerButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="md:hidden p-1.5 text-[#9A9A9A] hover:text-[#F5F5F5] transition-colors mr-2"
    >
      <Menu className="w-5 h-5" />
    </button>
  )
}

export default function ChatArea({ session, onOpenSidebar }: Props) {
  const { data: project } = useProjectsControllerFindById(session?.projectId ?? 0, {
    query: { enabled: !!session?.projectId },
  })
  const { prompts, sendPrompt, isSending } = usePrompts(session)
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

  const handleSend = useCallback(async (content: string, contextFiles: string[], claudeModel: string | null): Promise<void> => {
    await sendPrompt(content, contextFiles, claudeModel)
    clearFiles()
  }, [sendPrompt, clearFiles])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [prompts])

  if (!session) {
    return (
      <div className="flex-1 flex flex-col bg-[#1A1A1A] min-w-0">
        <div className="px-4 py-3 border-b border-[#3A3A3A] flex items-center md:hidden">
          <HamburgerButton onClick={onOpenSidebar} />
        </div>
        <EmptyState />
        <NoSessionInput />
      </div>
    )
  }

  return (
    <div
      className="flex-1 flex flex-col bg-[#1A1A1A] min-h-0 min-w-0 relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 z-10 bg-[#D97757]/10 border-2 border-dashed border-[#D97757] rounded-lg pointer-events-none flex items-center justify-center">
          <p className="text-[#D97757] text-sm font-medium">Solte para anexar arquivo</p>
        </div>
      )}

      <div className="px-4 py-3 border-b border-[#3A3A3A] flex-shrink-0 flex items-center">
        <HamburgerButton onClick={onOpenSidebar} />
        <div className="min-w-0">
          <h2 className="text-[#F5F5F5] font-semibold text-sm truncate">{session.chatName}</h2>
          {project && (
            <p className="text-[#9A9A9A] text-xs font-mono mt-0.5 truncate">{project.workDir}</p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {prompts.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <p className="text-[#9A9A9A] text-sm">Nenhuma mensagem ainda. Envie um prompt para começar.</p>
          </div>
        )}
        {prompts.map((prompt, index) => (
          <MessageItem key={prompt.id ?? index} prompt={prompt} />
        ))}
        <div ref={bottomRef} />
      </div>

      <ChatInput
        onSend={handleSend}
        disabled={isSending}
        attachedFiles={attachedFiles}
        onAttachFiles={addFiles}
        onRemoveFile={removeFile}
      />
    </div>
  )
}
