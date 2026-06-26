import { useState, useCallback } from 'react'
import ChatSidebar from './components/ChatSidebar'
import ChatArea from './components/ChatArea'
import NewChatModal from './components/NewChatModal'
import { useSessions } from './hooks/useSessions'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import type {
  ChatSessionsControllerFind200Item,
  ChatSessionsControllerCreateBody,
} from '../../api/generated/models'

export default function Chat() {
  return <ChatContent />
}

function ChatContent() {
  const [activeSession, setActiveSession] = useState<ChatSessionsControllerFind200Item | null>(null)
  const [showNewChatModal, setShowNewChatModal] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { sessions, isLoading, createSession, isCreating, deleteSession } = useSessions()

  const handleCreateSession = async (data: ChatSessionsControllerCreateBody) => {
    const session = await createSession(data)
    setActiveSession(session)
    setShowNewChatModal(false)
  }

  const handleSelectSession = (session: ChatSessionsControllerFind200Item) => {
    setActiveSession(session)
    setSidebarOpen(false)
  }

  const handleSelectByChatName = (chatName: string) => {
    const found = sessions.find(s => s.chatName === chatName) ?? null
    if (found) { setActiveSession(found); setSidebarOpen(false) }
  }

  const handleDeleteSession = async (chatName: string) => {
    await deleteSession(chatName)
    if (activeSession?.chatName === chatName) setActiveSession(null)
  }

  const handleSelectByIndex = useCallback((index: number) => {
    const session = sessions[index]
    if (session) handleSelectSession(session)
  }, [sessions])

  useKeyboardShortcuts({
    onOpenSearch: () => setSearchOpen(true),
    onNewChat: () => setShowNewChatModal(true),
    onSelectByIndex: handleSelectByIndex,
  })

  return (
    <div className="flex h-screen bg-claude-bg overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <ChatSidebar
        sessions={sessions}
        activeSessionId={activeSession?.id}
        onSelectSession={handleSelectSession}
        onSelectByChatName={handleSelectByChatName}
        onNewChat={() => setShowNewChatModal(true)}
        onDeleteSession={handleDeleteSession}
        isLoading={isLoading}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        searchOpen={searchOpen}
        onSearchOpenChange={setSearchOpen}
      />

      <ChatArea session={activeSession} onOpenSidebar={() => setSidebarOpen(true)} />

      {showNewChatModal && (
        <NewChatModal onConfirm={handleCreateSession} onClose={() => setShowNewChatModal(false)} isLoading={isCreating} />
      )}
    </div>
  )
}
