import { useState, useCallback } from 'react'
import ChatSidebar from './components/ChatSidebar'
import NewChatModal from './components/NewChatModal'
import LayoutPicker from './components/LayoutPicker'
import SplitChatLayout from './components/SplitChatLayout'
import { useSessions } from './hooks/useSessions'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { adjustPanelsForLayout, defaultLayoutForCount, LAYOUT_PANEL_COUNT } from './types/layout'
import type { LayoutType } from './types/layout'
import type {
  ChatSessionsControllerFind200Item,
  ChatSessionsControllerCreateBody,
} from '../../api/generated/models'

type PanelSession = ChatSessionsControllerFind200Item | null

export default function Chat() {
  return <ChatContent />
}

function ChatContent() {
  const [panels, setPanels] = useState<PanelSession[]>([null])
  const [layout, setLayout] = useState<LayoutType>('single')
  const [activePanelIndex, setActivePanelIndex] = useState(0)
  const [showNewChatModal, setShowNewChatModal] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { sessions, isLoading, createSession, isCreating, deleteSession } = useSessions()

  const activeSessionIds = panels
    .filter((p): p is ChatSessionsControllerFind200Item => p !== null)
    .map(p => p.id)
    .filter((id): id is number => id !== undefined)

  const handleCreateSession = async (data: ChatSessionsControllerCreateBody) => {
    const session = await createSession(data)
    const newPanels = [...panels]
    newPanels[activePanelIndex] = session
    setPanels(newPanels)
    setShowNewChatModal(false)
  }

  const handleSelectSession = (session: ChatSessionsControllerFind200Item) => {
    const newPanels = [...panels]
    newPanels[activePanelIndex] = session
    setPanels(newPanels)
    setSidebarOpen(false)
  }

  const handleSelectByChatName = (chatName: string) => {
    const found = sessions.find(s => s.chatName === chatName) ?? null
    if (!found) return
    const newPanels = [...panels]
    newPanels[activePanelIndex] = found
    setPanels(newPanels)
    setSidebarOpen(false)
  }

  const handleDeleteSession = async (chatName: string) => {
    await deleteSession(chatName)
    setPanels(prev => prev.map(p => p?.chatName === chatName ? null : p))
  }

  const handleLayoutChange = (newLayout: LayoutType) => {
    setLayout(newLayout)
    setPanels(prev => adjustPanelsForLayout(prev, newLayout, null))
    if (activePanelIndex >= LAYOUT_PANEL_COUNT[newLayout]) {
      setActivePanelIndex(0)
    }
  }

  const handleClosePanel = (index: number) => {
    const newPanels = panels.filter((_, i) => i !== index)
    setLayout(defaultLayoutForCount(newPanels.length))
    setPanels(newPanels)
    setActivePanelIndex(Math.min(activePanelIndex, newPanels.length - 1))
  }

  const handleOpenSidebar = (panelIndex: number) => {
    setActivePanelIndex(panelIndex)
    setSidebarOpen(true)
  }

  const handleSelectByIndex = useCallback((index: number) => {
    const session = sessions[index]
    if (!session) return
    const newPanels = [...panels]
    newPanels[activePanelIndex] = session
    setPanels(newPanels)
  }, [sessions, panels, activePanelIndex])

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
        activeSessionIds={activeSessionIds}
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

      <div className="flex-1 flex flex-col overflow-hidden min-w-0 min-h-0">
        <LayoutPicker layout={layout} onChange={handleLayoutChange} />
        <SplitChatLayout
          panels={panels}
          layout={layout}
          activePanelIndex={activePanelIndex}
          onPanelsChange={setPanels}
          onActivePanelChange={setActivePanelIndex}
          onClosePanel={handleClosePanel}
          onOpenSidebar={handleOpenSidebar}
        />
      </div>

      {showNewChatModal && (
        <NewChatModal onConfirm={handleCreateSession} onClose={() => setShowNewChatModal(false)} isLoading={isCreating} />
      )}
    </div>
  )
}
