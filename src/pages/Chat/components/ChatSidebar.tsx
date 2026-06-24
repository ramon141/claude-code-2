import { Plus, MessageSquare, Settings, X, FolderOpen } from 'lucide-react'
const logo = '/favicon.webp'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../../lib/utils'
import type { ChatSessionsControllerFind200Item } from '../../../api/generated/models'

interface Props {
  sessions: ChatSessionsControllerFind200Item[]
  activeSessionId: number | undefined
  onSelectSession: (session: ChatSessionsControllerFind200Item) => void
  onNewChat: () => void
  isLoading: boolean
  isOpen: boolean
  onClose: () => void
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
      className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm font-medium transition-colors text-[#9A9A9A] hover:bg-white/6 hover:text-[#F5F5F5]"
    >
      {icon}
      {label}
    </button>
  )
}

export default function ChatSidebar({ sessions, activeSessionId, onSelectSession, onNewChat, isLoading, isOpen, onClose }: Props) {
  const navigate = useNavigate()

  return (
    <aside className={cn(
      'w-64 flex-shrink-0 bg-[#2A2A2A] border-r border-[#3A3A3A] flex flex-col h-screen',
      'fixed md:sticky top-0 z-40 transition-transform duration-300',
      isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
    )}>
      <div className="px-4 py-4 border-b border-[#3A3A3A]">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0">
            <img src={logo} alt="ClaudePanel" className="w-full h-full object-cover" />
          </div>
          <span className="text-[#F5F5F5] font-semibold text-sm flex-1">ClaudePanel</span>
          <button
            type="button"
            onClick={onClose}
            className="md:hidden p-1 text-[#9A9A9A] hover:text-[#F5F5F5] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={onNewChat}
          className="flex items-center gap-2 w-full px-3 py-2 bg-[#D97757]/10 hover:bg-[#D97757]/20 border border-[#D97757]/30 rounded-xl text-[#D97757] text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2 px-2">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <span className="w-5 h-5 border-2 border-[#D97757] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!isLoading && sessions.length === 0 && (
          <p className="text-[#9A9A9A] text-xs text-center py-6 px-4">Nenhum chat ainda. Crie um novo!</p>
        )}
        {sessions.map((session) => (
          <button
            key={session.id}
            type="button"
            onClick={() => onSelectSession(session)}
            className={cn(
              'flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm transition-colors text-left',
              activeSessionId === session.id
                ? 'bg-white/10 text-[#F5F5F5]'
                : 'text-[#9A9A9A] hover:bg-white/6 hover:text-[#F5F5F5]'
            )}
          >
            <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{session.chatName}</span>
          </button>
        ))}
      </div>

      <div className="px-2 py-3 border-t border-[#3A3A3A] space-y-0.5">
        <NavLink icon={<FolderOpen className="w-4 h-4" />} label="Projetos" onClick={() => navigate('/projects')} />
        <NavLink icon={<Settings className="w-4 h-4" />} label="Configurações" onClick={() => navigate('/settings')} />
      </div>
    </aside>
  )
}
