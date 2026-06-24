import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Shield, ChevronDown, Bell, Settings,
} from 'lucide-react'
import { cn } from '../../lib/utils'
const logo = '/favicon.webp'

interface PrivateLayoutDesktopProps {
  children: React.ReactNode
  useBackground?: boolean
}

interface SidebarChild {
  text: string
  path: string
  activePaths: string[]
  icon: React.ReactNode
}

interface SidebarItemType {
  text: string
  path?: string
  activePaths: string[]
  icon: React.ReactNode
  children?: SidebarChild[]
}

const SIDEBAR_ITEMS: SidebarItemType[] = [
  { text: 'Dashboard', path: '/dashboard', activePaths: ['/dashboard'], icon: <LayoutDashboard className="w-4 h-4" /> },
  {
    text: 'Cadastros',
    activePaths: ['/register', '/register/epis'],
    icon: <Shield className="w-4 h-4" />,
    children: [
      { text: 'EPIs', path: '/register/epis', activePaths: ['/register/epis'], icon: <Shield className="w-4 h-4" /> },
    ],
  },
  { text: 'Notificações', path: '/notifications', activePaths: ['/notifications'], icon: <Bell className="w-4 h-4" /> },
  { text: 'Configurações', path: '/settings', activePaths: ['/settings'], icon: <Settings className="w-4 h-4" /> },
]

interface SidebarLeafProps {
  item: SidebarChild
  active: boolean
  onClick: () => void
}

const SidebarLeaf: React.FC<SidebarLeafProps> = ({ item, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'group relative flex items-center gap-3 w-full pl-9 pr-3 py-2 rounded-xl text-sm font-medium transition-all duration-150',
      active ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/6 hover:text-white'
    )}
  >
    {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-400 rounded-r-full" />}
    <span className={cn('flex-shrink-0 transition-colors', active ? 'text-blue-400' : 'text-slate-400 group-hover:text-white')}>
      {item.icon}
    </span>
    <span className="truncate">{item.text}</span>
  </button>
)

interface SidebarGroupProps {
  item: SidebarItemType
  isOpen: boolean
  anyChildActive: boolean
  onToggle: () => void
  onNavigate: (path: string) => void
  currentPath: string
}

const SidebarGroup: React.FC<SidebarGroupProps> = ({ item, isOpen, anyChildActive, onToggle, onNavigate, currentPath }) => (
  <div>
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'group relative flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
        anyChildActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/6 hover:text-white'
      )}
    >
      {anyChildActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-400 rounded-r-full" />}
      <span className={cn('flex-shrink-0 transition-colors', anyChildActive ? 'text-blue-400' : 'text-slate-300 group-hover:text-white')}>
        {item.icon}
      </span>
      <span className="flex-1 truncate text-left">{item.text}</span>
      <ChevronDown className={cn('w-3.5 h-3.5 flex-shrink-0 transition-transform duration-220', isOpen && 'rotate-180')} />
    </button>

    <div className={cn(
      'overflow-hidden transition-all duration-220',
      isOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
    )}>
      <div className="mt-0.5 ml-3 pl-3 border-l border-white/10 space-y-0.5 py-1">
        {item.children?.map((child, i) => (
          <SidebarLeaf
            key={i}
            item={child}
            active={child.activePaths.includes(currentPath)}
            onClick={() => onNavigate(child.path)}
          />
        ))}
      </div>
    </div>
  </div>
)

interface SidebarLeafRootProps {
  item: SidebarItemType
  active: boolean
  onClick: () => void
}

const SidebarLeafRoot: React.FC<SidebarLeafRootProps> = ({ item, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'group relative flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
      active ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/6 hover:text-white'
    )}
  >
    {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-400 rounded-r-full" />}
    <span className={cn('flex-shrink-0 transition-colors', active ? 'text-blue-400' : 'text-slate-300 group-hover:text-white')}>
      {item.icon}
    </span>
    <span className="truncate">{item.text}</span>
  </button>
)

const PrivateLayoutDesktop: React.FC<PrivateLayoutDesktopProps> = ({ children, useBackground = true }) => {
  const location = useLocation()
  const navigate = useNavigate()

  const [openGroups, setOpenGroups] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {}
    SIDEBAR_ITEMS.forEach((item, i) => {
      if (item.children?.some((c) => c.activePaths.includes(location.pathname))) {
        initial[i] = true
      }
    })
    return initial
  })

  const toggleGroup = (index: number) =>
    setOpenGroups((prev) => ({ ...prev, [index]: !prev[index] }))

  return (
    <div className="flex min-h-screen bg-base">
      <aside className="w-[240px] flex-shrink-0 bg-sidebar flex flex-col h-screen sticky top-0 shadow-sidebar">
        <div className="px-5 py-5 border-b border-sidebar-border">
          <img src={logo} alt="Logo" className="h-9" />
        </div>

        <nav className="flex-1 overflow-y-auto sidebar-scroll px-3 py-4 space-y-0.5">
          {SIDEBAR_ITEMS.map((item, index) => {
            if (item.children) {
              const anyChildActive = item.children.some((c) => c.activePaths.includes(location.pathname))
              return (
                <SidebarGroup
                  key={index}
                  item={item}
                  isOpen={!!openGroups[index]}
                  anyChildActive={anyChildActive}
                  onToggle={() => toggleGroup(index)}
                  onNavigate={navigate}
                  currentPath={location.pathname}
                />
              )
            }
            return (
              <SidebarLeafRoot
                key={index}
                item={item}
                active={item.activePaths.includes(location.pathname)}
                onClick={() => item.path && navigate(item.path)}
              />
            )
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <main className={cn('flex-1 p-6', !useBackground && 'bg-transparent')}>
          {useBackground
            ? <div className="bg-white rounded-2xl shadow-card min-h-full">{children}</div>
            : children
          }
        </main>
      </div>
    </div>
  )
}

export default PrivateLayoutDesktop
