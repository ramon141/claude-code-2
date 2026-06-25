import React, { useState, useRef } from 'react'
import { Send, Paperclip, X } from 'lucide-react'
import { open } from '@tauri-apps/plugin-dialog'
import SlashCommandMenu from './SlashCommandMenu'
import { useSlashCommands } from '../hooks/useSlashCommands'
import type { SlashCommand } from '../constants/slashCommands'

interface Props {
  onSend: (content: string, contextFiles: string[]) => Promise<void>
  disabled: boolean
  attachedFiles: string[]
  onAttachFiles: (paths: string[]) => void
  onRemoveFile: (path: string) => void
}

function FileChip({ path, onRemove }: { path: string; onRemove: () => void }) {
  const name = path.split('/').pop() ?? path
  return (
    <div className="flex items-center gap-1 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg px-2 py-1 text-xs text-[#F5F5F5] max-w-[180px]">
      <span className="truncate" title={path}>{name}</span>
      <button
        type="button"
        onClick={onRemove}
        className="flex-shrink-0 text-[#9A9A9A] hover:text-[#F5F5F5] transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}

async function openFileDialog(): Promise<string[]> {
  const result = await open({ multiple: true, directory: false })
  if (!result) return []
  return Array.isArray(result) ? result : [result]
}

export default function ChatInput({ onSend, disabled, attachedFiles, onAttachFiles, onRemoveFile }: Props) {
  const [value, setValue] = useState('')
  const [sending, setSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const slash = useSlashCommands(value)

  const applyCommand = (item: SlashCommand) => {
    setValue(`${item.command} `)
    textareaRef.current?.focus()
  }

  const handleSubmit = async () => {
    const trimmed = value.trim()
    if (!trimmed || sending || disabled) return
    try {
      setSending(true)
      await onSend(trimmed, attachedFiles)
      setValue('')
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
    } finally {
      setSending(false)
    }
  }

  const handleAttachClick = async () => {
    const paths = await openFileDialog()
    if (paths.length > 0) onAttachFiles(paths)
  }

  const [menuDismissed, setMenuDismissed] = useState(false)
  const menuOpen = slash.open && !menuDismissed

  const handleMenuKey = (e: React.KeyboardEvent<HTMLTextAreaElement>): boolean => {
    if (e.key === 'ArrowDown') { e.preventDefault(); slash.moveSelection(1); return true }
    if (e.key === 'ArrowUp') { e.preventDefault(); slash.moveSelection(-1); return true }
    if (e.key === 'Escape') { e.preventDefault(); setMenuDismissed(true); return true }
    if (e.key === 'Enter' || e.key === 'Tab') {
      const selected = slash.resolveSelection()
      if (!selected) return false
      e.preventDefault()
      applyCommand(selected)
      return true
    }
    return false
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (menuOpen && handleMenuKey(e)) return
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMenuDismissed(false)
    setValue(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }

  const canSend = value.trim().length > 0 && !sending && !disabled

  return (
    <div className="p-4 border-t border-[#3A3A3A] relative">
      {menuOpen && (
        <SlashCommandMenu
          commands={slash.commands}
          activeIndex={slash.activeIndex}
          onSelect={applyCommand}
          onHover={slash.setActiveIndex}
        />
      )}

      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {attachedFiles.map((path) => (
            <FileChip key={path} path={path} onRemove={() => onRemoveFile(path)} />
          ))}
        </div>
      )}

      <div className="flex items-end gap-3 bg-[#2A2A2A] border border-[#3A3A3A] rounded-2xl px-4 py-3 focus-within:border-[#D97757]/50 transition-colors">
        <button
          type="button"
          onClick={handleAttachClick}
          disabled={disabled || sending}
          title="Anexar arquivo"
          className="flex-shrink-0 text-[#9A9A9A] hover:text-[#F5F5F5] transition-colors disabled:opacity-30 disabled:cursor-not-allowed self-center"
        >
          <Paperclip className="w-4 h-4" />
        </button>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Digite seu prompt... (Enter para enviar, Shift+Enter para nova linha)"
          rows={1}
          disabled={disabled || sending}
          className="flex-1 bg-transparent text-[#F5F5F5] text-sm outline-none focus:outline-none focus:ring-0 resize-none placeholder:text-[#9A9A9A] leading-relaxed disabled:opacity-50 min-h-[1.5rem] self-center"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSend}
          className="flex-shrink-0 w-9 h-9 bg-[#D97757] hover:bg-[#C4663F] rounded-xl flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {sending
            ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <Send className="w-4 h-4 text-white" />
          }
        </button>
      </div>
      <p className="text-center text-[#9A9A9A] text-xs mt-2">
        ClaudePanel pode cometer erros. Sempre revise o código gerado.
      </p>
    </div>
  )
}
