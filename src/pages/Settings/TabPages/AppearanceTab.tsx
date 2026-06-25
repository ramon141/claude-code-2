import React from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from '../../../contexts/ThemeContext'
import { cn } from '../../../lib/utils'

type ThemeMode = 'light' | 'dark' | 'system'

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: React.ReactNode; description: string }[] = [
  { value: 'light', label: 'Claro', icon: <Sun className="w-5 h-5" />, description: 'Fundo branco, ideal para ambientes iluminados' },
  { value: 'dark', label: 'Escuro', icon: <Moon className="w-5 h-5" />, description: 'Fundo escuro, confortável em ambientes com pouca luz' },
  { value: 'system', label: 'Sistema', icon: <Monitor className="w-5 h-5" />, description: 'Segue a preferência do sistema operacional' },
]

const AppearanceTab: React.FC = () => {
  const { mode, setMode } = useTheme()

  return (
    <div className="flex flex-col gap-5">
      <section className="bg-claude-surface border border-claude-border rounded-2xl p-6 flex flex-col gap-5">
        <header className="flex items-center gap-3">
          <span className="text-claude-primary"><Sun className="w-5 h-5" /></span>
          <div>
            <h2 className="text-claude-text font-semibold">Tema</h2>
            <p className="text-claude-muted text-sm">Escolha como a interface deve aparecer</p>
          </div>
        </header>

        <div className="grid grid-cols-3 gap-3">
          {THEME_OPTIONS.map((opt) => (
            <ThemeCard
              key={opt.value}
              option={opt}
              selected={mode === opt.value}
              onSelect={() => setMode(opt.value)}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

interface ThemeCardProps {
  option: { value: ThemeMode; label: string; icon: React.ReactNode; description: string }
  selected: boolean
  onSelect: () => void
}

function ThemeCard({ option, selected, onSelect }: ThemeCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all text-left',
        selected
          ? 'border-claude-primary bg-claude-primary/10'
          : 'border-claude-border bg-claude-bg hover:border-claude-muted'
      )}
    >
      <ThemePreview value={option.value} />
      <div className="w-full">
        <div className={cn('flex items-center gap-2 font-medium text-sm', selected ? 'text-claude-primary' : 'text-claude-text')}>
          {option.icon}
          {option.label}
        </div>
        <p className="text-claude-muted text-xs mt-1 leading-relaxed">{option.description}</p>
      </div>
    </button>
  )
}

function ThemePreview({ value }: { value: ThemeMode }) {
  if (value === 'light') {
    return (
      <div className="w-full h-16 rounded-lg bg-[#F8F8F8] border border-[#DCDCDC] overflow-hidden flex flex-col">
        <div className="h-4 bg-[#FFFFFF] border-b border-[#DCDCDC] flex items-center px-2 gap-1">
          <div className="w-2 h-1.5 rounded-sm bg-[#DCDCDC]" />
          <div className="w-4 h-1.5 rounded-sm bg-[#DCDCDC]" />
        </div>
        <div className="flex-1 flex gap-1 p-1.5">
          <div className="w-8 bg-[#ECECEC] rounded" />
          <div className="flex-1 flex flex-col gap-1">
            <div className="h-1.5 bg-[#DCDCDC] rounded w-3/4" />
            <div className="h-1.5 bg-[#DCDCDC] rounded w-1/2" />
          </div>
        </div>
      </div>
    )
  }
  if (value === 'dark') {
    return (
      <div className="w-full h-16 rounded-lg bg-[#1A1A1A] border border-[#3A3A3A] overflow-hidden flex flex-col">
        <div className="h-4 bg-[#2A2A2A] border-b border-[#3A3A3A] flex items-center px-2 gap-1">
          <div className="w-2 h-1.5 rounded-sm bg-[#3A3A3A]" />
          <div className="w-4 h-1.5 rounded-sm bg-[#3A3A3A]" />
        </div>
        <div className="flex-1 flex gap-1 p-1.5">
          <div className="w-8 bg-[#2A2A2A] rounded" />
          <div className="flex-1 flex flex-col gap-1">
            <div className="h-1.5 bg-[#3A3A3A] rounded w-3/4" />
            <div className="h-1.5 bg-[#3A3A3A] rounded w-1/2" />
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="w-full h-16 rounded-lg overflow-hidden border border-[#DCDCDC] flex flex-col" style={{ background: 'linear-gradient(135deg, #1A1A1A 50%, #F8F8F8 50%)' }}>
      <div className="flex-1 flex gap-1 p-1.5 items-end justify-center">
        <Moon className="w-4 h-4 text-[#9A9A9A]" />
        <Sun className="w-4 h-4 text-[#6B6B6B]" />
      </div>
    </div>
  )
}

export default AppearanceTab
