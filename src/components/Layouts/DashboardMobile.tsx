import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Menu, Shield, X, Bell, Settings,
} from 'lucide-react'
import { cn } from '../../lib/utils'
const logo = '/favicon.webp'

interface PrivateLayoutMobileProps {
  children: React.ReactNode
  useBackgroundMobile?: boolean
}

interface SidebarItem {
  text: string
  path: string
  icon: React.ReactNode
  activePaths: string[]
  sub?: boolean
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { text: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" />, activePaths: ['/dashboard'] },
  { text: 'Cadastros', path: '/register', icon: <Shield className="w-4 h-4" />, activePaths: ['/register'] },
  { text: 'EPIs', path: '/register/epis', icon: <Shield className="w-4 h-4" />, activePaths: ['/register/epis'], sub: true },
  { text: 'Notificações', path: '/notifications', icon: <Bell className="w-4 h-4" />, activePaths: ['/notifications'] },
  { text: 'Configurações', path: '/settings', icon: <Settings className="w-4 h-4" />, activePaths: ['/settings'] },
]

const QUICK_NAV = [
  { path: '/dashboard', activePaths: ['/dashboard'], icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
  { path: '/register', activePaths: ['/register', '/register/epis', '/register/users'], icon: <Shield className="w-5 h-5" />, label: 'Cadastros' },
  { path: '/notifications', activePaths: ['/notifications'], icon: <Bell className="w-5 h-5" />, label: 'Alertas' },
]

const PrivateLayoutMobile: React.FC<PrivateLayoutMobileProps> = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [isDrawerOpen, setDrawerOpen] = useState(false)

  const isActive = (paths: string[]) => paths.includes(location.pathname)

  const handleNavigation = (path: string) => {
    navigate(path)
    setDrawerOpen(false)
  }

  const drawer = isDrawerOpen ? createPortal(
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
      <div className="relative w-[280px] bg-sidebar flex flex-col overflow-y-auto sidebar-scroll z-10">
        <div className="flex items-center justify-between px-5 py-4 border-b border-sidebar-border">
          <img src={logo} alt="Logo" className="h-8" />
          <button type="button" onClick={() => setDrawerOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {SIDEBAR_ITEMS.map((item, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleNavigation(item.path)}
              className={cn(
                'group relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all',
                item.sub ? 'w-[calc(100%-12px)] ml-3 px-3 py-2' : 'w-full px-3 py-2.5',
                isActive(item.activePaths)
                  ? 'bg-white/10 text-white'
                  : 'text-slate-300 hover:bg-white/6 hover:text-white'
              )}
            >
              {isActive(item.activePaths) && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-400 rounded-r-full" />
              )}
              <span className={cn('flex-shrink-0', isActive(item.activePaths) ? 'text-blue-400' : 'text-slate-300')}>
                {item.icon}
              </span>
              {item.text}
            </button>
          ))}
        </nav>
      </div>
    </div>,
    document.body
  ) : null

  return (
    <div className="flex flex-col min-h-screen bg-base">
      <header className="flex items-center h-14 px-4 bg-sidebar border-b border-sidebar-border sticky top-0 z-40">
        <img src={logo} alt="Logo" className="h-7" />

        <div className="flex-1 flex items-center justify-center gap-1">
          {QUICK_NAV.map((nav, i) => (
            <button
              key={i}
              type="button"
              onClick={() => navigate(nav.path)}
              className={cn(
                'flex flex-col items-center px-3 py-1 rounded-lg transition-colors',
                isActive(nav.activePaths) ? 'text-blue-400' : 'text-slate-300 hover:text-white'
              )}
            >
              {nav.icon}
              <span className="text-[10px] mt-0.5 font-medium">{nav.label}</span>
            </button>
          ))}
        </div>

        <button type="button" onClick={() => setDrawerOpen(true)} className="p-2 text-slate-300 hover:text-white transition-colors rounded-lg">
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {drawer}

      <main className="flex-1 p-4">
        {children}
      </main>
    </div>
  )
}

export default PrivateLayoutMobile
