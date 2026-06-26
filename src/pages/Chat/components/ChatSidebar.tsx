import { useState } from 'react'
import { Plus, MessageSquare, Settings, X, FolderOpen, Trash2, Search } from 'lucide-react'
const logo = '/favicon.webp'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../../lib/utils'
import type { ChatSessionsControllerFind200Item } from '../../../api/generated/models'
import ChatSearchModal from './ChatSearchModal'

interface Props {
  sessions: ChatSessionsControllerFind200Item[]
  activeSessionId: number | undefined
  onSelectSession: (session: ChatSessionsControllerFind200Item) => void
  onSelectByChatName: (chatName: string) => void
  onNewChat: () => void
  onDeleteSession: (chatName: string) => Promise<void>
  isLoading: boolean
  isOpen: boolean
  onClose: () => void
  searchOpen: boolean
  onSearchOpenChange: (open: boolean) => void
}

interface NavLinkProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
}

function NavLink({ icon, label, onClick }: NavLinkProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm font-medium transition-colors text-claude-muted hover:bg-white/6 hover:text-claude-text"
    >
      {icon}
      {label}
    </button>
  )
}

interface SessionItemProps {
  session: ChatSessionsControllerFind200Item
  isActive: boolean
  isPending: boolean
  onSelect: () => void
  onDelete: () => void
}

function SessionItem({ session, isActive, isPending, onSelect, onDelete }: SessionItemProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleDeleteClick = (e: React.MouseEvent) => { e.stopPropagation(); setConfirmDelete(true) }
  const handleConfirm = (e: React.MouseEvent) => { e.stopPropagation(); onDelete() }
  const handleCancel = (e: React.MouseEvent) => { e.stopPropagation(); setConfirmDelete(false) }

  if (confirmDelete) {
    return (
      <div className="flex items-center gap-1 w-full px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
        <span className="text-xs text-red-400 flex-1 truncate">Deletar "{session.chatName}"?</span>
        <button type="button" onClick={handleConfirm} className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors flex-shrink-0">Sim</button>
        <button type="button" onClick={handleCancel} className="text-xs px-2 py-0.5 rounded text-claude-muted hover:text-claude-text transition-colors flex-shrink-0">Não</button>
      </div>
    )
  }

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          'flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm transition-colors text-left pr-8',
          isActive ? 'bg-white/10 text-claude-text' : 'text-claude-muted hover:bg-white/6 hover:text-claude-text'
        )}
      >
        <div className="relative flex-shrink-0 self-center">
          <MessageSquare className="w-3.5 h-3.5" />
          {isPending && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-claude-primary animate-pulse" />}
        </div>
        <div className="min-w-0">
          <span className="truncate block">{session.chatName}</span>
          {session.projectName && (
            <span className="truncate block text-xs text-claude-muted/70 mt-0.5">
              {session.projectName}
            </span>
          )}
        </div>
      </button>
      <button
        type="button"
        onClick={handleDeleteClick}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-claude-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
        title="Deletar chat"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

export default function ChatSidebar({ sessions, activeSessionId, onSelectSession, onSelectByChatName, onNewChat, onDeleteSession, isLoading, isOpen, onClose, searchOpen, onSearchOpenChange }: Props) {
  const navigate = useNavigate()

  return (
    <>
      <aside className={cn(
        'w-64 flex-shrink-0 bg-claude-surface border-r border-claude-border flex flex-col h-screen',
        'fixed md:sticky top-0 z-40 transition-transform duration-300',
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )}>
        <div className="px-4 py-4 border-b border-claude-border flex flex-col gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0">
              <img src={logo} alt="ClaudePanel" className="w-full h-full object-cover" />
            </div>
            <span className="text-claude-text font-semibold text-sm flex-1">ClaudePanel</span>
            <button type="button" onClick={onClose} className="md:hidden p-1 text-claude-muted hover:text-claude-text transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={onNewChat}
            className="flex items-center gap-2 w-full px-3 py-2 bg-claude-primary/10 hover:bg-claude-primary/20 border border-claude-primary/30 rounded-xl text-claude-primary text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Chat
          </button>
          <button
            type="button"
            onClick={() => onSearchOpenChange(true)}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-medium transition-colors text-claude-muted hover:bg-white/6 hover:text-claude-text border border-claude-border"
          >
            <Search className="w-4 h-4" />
            Buscar
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2 px-2">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <span className="w-5 h-5 border-2 border-claude-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!isLoading && sessions.length === 0 && (
            <p className="text-claude-muted text-xs text-center py-6 px-4">Nenhum chat ainda. Crie um novo!</p>
          )}
          {sessions.map((session) => (
            <SessionItem
              key={session.id}
              session={session}
              isActive={activeSessionId === session.id}
              isPending={session.hasPendingPrompts ?? false}
              onSelect={() => onSelectSession(session)}
              onDelete={() => onDeleteSession(session.chatName ?? '')}
            />
          ))}
        </div>

        <div className="px-2 py-3 border-t border-claude-border space-y-0.5">
          <NavLink icon={<FolderOpen className="w-4 h-4" />} label="Projetos" onClick={() => navigate('/projects')} />
          <NavLink icon={<Settings className="w-4 h-4" />} label="Configurações" onClick={() => navigate('/settings')} />
        </div>
      </aside>

      {searchOpen && (
        <ChatSearchModal
          sessions={sessions}
          onSelect={onSelectByChatName}
          onClose={() => onSearchOpenChange(false)}
        />
      )}
    </>
  )
}
