import React, { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'

interface Props {
  onSend: (content: string) => Promise<void>
  disabled: boolean
  injectedText?: string | null
  onInjectedConsumed?: () => void
}

export default function ChatInput({ onSend, disabled, injectedText, onInjectedConsumed }: Props) {
  const [value, setValue] = useState('')
  const [sending, setSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!injectedText) return
    setValue((prev) => (prev ? `${prev} ${injectedText}` : injectedText))
    textareaRef.current?.focus()
    onInjectedConsumed?.()
  }, [injectedText, onInjectedConsumed])

  const handleSubmit = async () => {
    const trimmed = value.trim()
    if (!trimmed || sending || disabled) return
    try {
      setSending(true)
      await onSend(trimmed)
      setValue('')
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }

  const canSend = value.trim().length > 0 && !sending && !disabled

  return (
    <div className="p-4 border-t border-[#3A3A3A]">
      <div className="flex items-end gap-3 bg-[#2A2A2A] border border-[#3A3A3A] rounded-2xl px-4 py-3 focus-within:border-[#D97757]/50 transition-colors">
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
