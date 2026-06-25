import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, LayoutDashboard, Terminal, SlidersHorizontal, MessageCircle, Palette } from 'lucide-react'
import { cn } from '../../lib/utils'
import ClaudeCodeAccountsTab from './TabPages/ClaudeCodeAccountsTab'
import DashboardTab from './TabPages/DashboardTab'
import ApplicationTab from './TabPages/ApplicationTab'
import WhatsAppTab from './TabPages/WhatsAppTab'
import AppearanceTab from './TabPages/AppearanceTab'

interface Tab {
  id: string
  label: string
  icon: React.ReactNode
}

const TABS: Tab[] = [
  { id: 'claude-accounts', label: 'Contas Claude', icon: <Terminal className="w-4 h-4" /> },
  { id: 'application',     label: 'Aplicação',     icon: <SlidersHorizontal className="w-4 h-4" /> },
  { id: 'whatsapp',        label: 'WhatsApp',      icon: <MessageCircle className="w-4 h-4" /> },
  { id: 'dashboard',       label: 'Dashboard',     icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'appearance',      label: 'Aparência',     icon: <Palette className="w-4 h-4" /> },
]

function TabContent({ activeTab }: { activeTab: string }) {
  if (activeTab === 'claude-accounts') return <ClaudeCodeAccountsTab />
  if (activeTab === 'application') return <ApplicationTab />
  if (activeTab === 'whatsapp') return <WhatsAppTab />
  if (activeTab === 'appearance') return <AppearanceTab />
  return <DashboardTab />
}

export default function Settings() {
  return <SettingsContent />
}

function SettingsContent() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('claude-accounts')

  return (
    <div className="min-h-screen bg-claude-bg">
      <div className="border-b border-claude-border px-6 py-4 flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-claude-muted hover:text-claude-text transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-claude-text font-semibold">Configurações</h1>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="flex gap-1 mb-6 bg-claude-surface p-1 rounded-xl border border-claude-border w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === tab.id
                  ? 'bg-claude-primary text-white'
                  : 'text-claude-muted hover:text-claude-text'
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
