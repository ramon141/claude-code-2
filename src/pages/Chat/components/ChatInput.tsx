import React, { useState, useRef } from 'react'
import { Send, Paperclip, X, Timer, Link, LayoutTemplate } from 'lucide-react'
import { toast } from 'react-toastify'
import { invoke } from '@tauri-apps/api/core'
import PromptTemplatesModal from './PromptTemplatesModal'
import { open } from '@tauri-apps/plugin-dialog'
import SlashCommandMenu from './SlashCommandMenu'
import WaitForDropdown from './WaitForDropdown'
import { useSlashCommands } from '../hooks/useSlashCommands'
import type { SlashCommand } from '../constants/slashCommands'
import { CLAUDE_MODELS, type ClaudeModelId } from '../constants/claudeModels'

interface Props {
  onSend: (content: string, contextFiles: string[], claudeModel: string | null, waitForPromptId: number | null, useWaitResponse: boolean) => Promise<void>
  disabled: boolean
  attachedFiles: string[]
  onAttachFiles: (paths: string[]) => void
  onRemoveFile: (path: string) => void
  currentChatName: string | null
}

function FileChip({ path, onRemove }: { path: string; onRemove: () => void }) {
  const name = path.split('/').pop() ?? path
  return (
    <div className="flex items-center gap-1 bg-claude-surface border border-claude-border rounded-lg px-2 py-1 text-xs text-claude-text max-w-[180px]">
      <span className="truncate" title={path}>{name}</span>
      <button
        type="button"
        onClick={onRemove}
        className="flex-shrink-0 text-claude-muted hover:text-claude-text transition-colors"
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

async function saveClipboardImage(imageData: ArrayBuffer, mimeType: string, onAttach: (paths: string[]) => void): Promise<void> {
  try {
    const bytes = Array.from(new Uint8Array(imageData))
    const ext = mimeType.split('/')[1] || 'png'
    const fileName = `clipboard_${Date.now()}.${ext}`

    const path: string = await invoke('save_clipboard_image', { fileName, imageData: bytes })
    onAttach([path])
    toast.success('Imagem colada e anexada')
  } catch (error) {
    console.error('Erro ao salvar imagem:', JSON.stringify(error))
    toast.error('Erro ao colar imagem')
  }
}

export default function ChatInput({ onSend, disabled, attachedFiles, onAttachFiles, onRemoveFile, currentChatName }: Props) {
  const [value, setValue] = useState('')
  const [sending, setSending] = useState(false)
  const [selectedModel, setSelectedModel] = useState<ClaudeModelId | ''>('')
  const [waitForPromptId, setWaitForPromptId] = useState<number | null>(null)
  const [waitForChatName, setWaitForChatName] = useState<string | null>(null)
  const [waitDropdownOpen, setWaitDropdownOpen] = useState(false)
  const [useWaitResponse, setUseWaitResponse] = useState(false)
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
      await onSend(trimmed, attachedFiles, selectedModel || null, waitForPromptId, useWaitResponse)
      setValue('')
      setWaitForPromptId(null)
      setWaitForChatName(null)
      setUseWaitResponse(false)
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
    } finally {
      setSending(false)
    }
  }

  const handleAttachClick = async () => {
    const paths = await openFileDialog()
    if (paths.length > 0) onAttachFiles(paths)
  }

  const [showTemplates, setShowTemplates] = useState(false)
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

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const files = e.clipboardData?.files
    if (files) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (file && file.type.startsWith('image/')) {
          e.preventDefault()
          const imageBuffer = await file.arrayBuffer()
          await saveClipboardImage(imageBuffer, file.type, onAttachFiles)
          return
        }
      }
    }

    try {
      const items = await navigator.clipboard.read()
      for (const item of items) {
        const imageType = item.types.find(t => t.startsWith('image/'))
        if (imageType) {
          e.preventDefault()
          const blob = await item.getType(imageType)
          const arrayBuffer = await blob.arrayBuffer()
          await saveClipboardImage(arrayBuffer, imageType, onAttachFiles)
          return
        }
      }
    } catch (error) {
      console.error('Erro ao ler clipboard:', JSON.stringify(error))
    }
  }

  const canSend = value.trim().length > 0 && !sending && !disabled

  return (
    <div className="p-4 border-t border-claude-border relative">
      {showTemplates && (
        <PromptTemplatesModal
          onClose={() => setShowTemplates(false)}
          onUse={(content) => { setValue(content); textareaRef.current?.focus() }}
        />
      )}
      {menuOpen && (
        <SlashCommandMenu
          commands={slash.commands}
          activeIndex={slash.activeIndex}
          onSelect={applyCommand}
          onHover={slash.setActiveIndex}
        />
      )}

      {waitDropdownOpen && (
        <WaitForDropdown
          currentChatName={currentChatName}
          selected={waitForPromptId}
          useWaitResponse={useWaitResponse}
          onSelect={(id, chatName) => { setWaitForPromptId(id); setWaitForChatName(chatName) }}
          onClose={() => setWaitDropdownOpen(false)}
        />
      )}

      {waitForPromptId != null && (
        <div className="flex items-center gap-1.5 mb-2">
          <div className="inline-flex items-center gap-1.5 bg-claude-primary/10 border border-claude-primary/30 rounded-lg px-2 py-1 text-xs text-claude-primary">
            <Link className="w-3 h-3" />
            Aguardando prompt #{waitForPromptId}
            {waitForChatName && <span className="text-claude-primary/70">({waitForChatName})</span>}
            <button
              type="button"
              onClick={() => { setWaitForPromptId(null); setWaitForChatName(null) }}
              className="ml-0.5 hover:text-white transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <label className="inline-flex items-center gap-1.5 text-xs text-claude-muted cursor-pointer select-none">
            <input
              type="checkbox"
              checked={useWaitResponse}
              onChange={e => setUseWaitResponse(e.target.checked)}
              className="w-3.5 h-3.5 accent-claude-primary"
            />
            Usar resposta
          </label>
        </div>
      )}

      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {attachedFiles.map((path) => (
            <FileChip key={path} path={path} onRemove={() => onRemoveFile(path)} />
          ))}
        </div>
      )}

      <div className="flex items-end gap-3 bg-claude-surface border border-claude-border rounded-2xl px-4 py-3 focus-within:border-claude-primary/50 transition-colors">
        <button
          type="button"
          onClick={handleAttachClick}
          disabled={disabled || sending}
          title="Anexar arquivo"
          className="flex-shrink-0 text-claude-muted hover:text-claude-text transition-colors disabled:opacity-30 disabled:cursor-not-allowed self-center"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setShowTemplates(true)}
          disabled={disabled || sending}
          title="Templates de prompt"
          className="flex-shrink-0 text-claude-muted hover:text-claude-text transition-colors disabled:opacity-30 disabled:cursor-not-allowed self-center"
        >
          <LayoutTemplate className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setWaitDropdownOpen(prev => !prev)}
          disabled={disabled || sending}
          title="Aguardar prompt de outro chat"
          className={`flex-shrink-0 transition-colors disabled:opacity-30 disabled:cursor-not-allowed self-center ${waitForPromptId != null ? 'text-claude-primary' : 'text-claude-muted hover:text-claude-text'}`}
        >
          <Timer className="w-4 h-4" />
        </button>

        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value as ClaudeModelId | '')}
          disabled={disabled || sending}
          className="flex-shrink-0 bg-transparent text-claude-muted text-xs outline-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed self-center hover:text-claude-text transition-colors"
        >
          <option value="">Modelo padrão</option>
          {CLAUDE_MODELS.map((m) => (
            <option key={m.id} value={m.id} className="bg-claude-surface text-claude-text">
              {m.label}
            </option>
          ))}
        </select>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Digite seu prompt... (Enter para enviar, Shift+Enter para nova linha)"
          rows={1}
          disabled={disabled || sending}
          className="flex-1 bg-transparent text-claude-text text-sm outline-none focus:outline-none focus:ring-0 resize-none placeholder:text-claude-muted leading-relaxed disabled:opacity-50 min-h-[1.5rem] self-center"
        />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSend}
          className="flex-shrink-0 w-9 h-9 bg-claude-primary hover:bg-claude-primary-hover rounded-xl flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {sending
            ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <Send className="w-4 h-4 text-white" />
          }
        </button>
      </div>
      <p className="text-center text-claude-muted text-xs mt-2">
        ClaudePanel pode cometer erros. Sempre revise o código gerado.
      </p>
    </div>
  )
}
