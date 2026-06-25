import { useState } from 'react'
import ChatSidebar from './components/ChatSidebar'
import ChatArea from './components/ChatArea'
import NewChatModal from './components/NewChatModal'
import { useSessions } from './hooks/useSessions'
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
  const { sessions, isLoading, createSession, isCreating } = useSessions()

  const handleCreateSession = async (data: ChatSessionsControllerCreateBody) => {
    const session = await createSession(data)
    setActiveSession(session)
    setShowNewChatModal(false)
  }

  const handleSelectSession = (session: ChatSessionsControllerFind200Item) => {
    setActiveSession(session)
    setSidebarOpen(false)
  }

  return (
    <div className="flex h-screen bg-claude-bg overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <ChatSidebar
        sessions={sessions}
        activeSessionId={activeSession?.id}
        onSelectSession={handleSelectSession}
        onNewChat={() => setShowNewChatModal(true)}
        isLoading={isLoading}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <ChatArea
        session={activeSession}
        onOpenSidebar={() => setSidebarOpen(true)}
      />

      {showNewChatModal && (
        <NewChatModal
          onConfirm={handleCreateSession}
          onClose={() => setShowNewChatModal(false)}
          isLoading={isCreating}
        />
      )}
    </div>
  )
}
