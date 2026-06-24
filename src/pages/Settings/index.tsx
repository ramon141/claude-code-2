import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, User, LayoutDashboard, Terminal, SlidersHorizontal } from 'lucide-react'
import { cn } from '../../lib/utils'
import ClaudeCodeAccountsTab from './TabPages/ClaudeCodeAccountsTab'
import DashboardTab from './TabPages/DashboardTab'
import AccountTab from './TabPages/AccountTab'
import ApplicationTab from './TabPages/ApplicationTab'

interface Tab {
  id: string
  label: string
  icon: React.ReactNode
}

const TABS: Tab[] = [
  { id: 'claude-accounts', label: 'Contas Claude', icon: <Terminal className="w-4 h-4" /> },
  { id: 'application',     label: 'Aplicação',     icon: <SlidersHorizontal className="w-4 h-4" /> },
  { id: 'dashboard',       label: 'Dashboard',     icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'account',         label: 'Conta',         icon: <User className="w-4 h-4" /> },
]

function TabContent({ activeTab }: { activeTab: string }) {
  if (activeTab === 'claude-accounts') return <ClaudeCodeAccountsTab />
  if (activeTab === 'application') return <ApplicationTab />
  if (activeTab === 'dashboard') return <DashboardTab />
  return <AccountTab />
}

export default function Settings() {
  return <SettingsContent />
}

function SettingsContent() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('claude-accounts')

  return (
    <div className="min-h-screen bg-[#1A1A1A]">
      <div className="border-b border-[#3A3A3A] px-6 py-4 flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-[#9A9A9A] hover:text-[#F5F5F5] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-[#F5F5F5] font-semibold">Configurações</h1>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="flex gap-1 mb-6 bg-[#2A2A2A] p-1 rounded-xl border border-[#3A3A3A] w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === tab.id
                  ? 'bg-[#D97757] text-white'
                  : 'text-[#9A9A9A] hover:text-[#F5F5F5]'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <TabContent activeTab={activeTab} />
      </div>
    </div>
  )
}
