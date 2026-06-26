import { useState } from 'react'
import { X, Trash2, LayoutTemplate, Plus } from 'lucide-react'
import { usePromptTemplates } from '../hooks/usePromptTemplates'
import type { PromptTemplate } from '../hooks/usePromptTemplates'

interface Props {
  onClose: () => void
  onUse: (content: string) => void
}

function TemplateItem({ template, onUse, onDelete }: { template: PromptTemplate; onUse: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl border border-claude-border hover:border-claude-primary/30 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-claude-text text-sm font-medium truncate">{template.name}</p>
        <p className="text-claude-muted text-xs mt-0.5 line-clamp-2">{template.content}</p>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <button
          type="button"
          onClick={onUse}
          className="text-xs px-2 py-1 rounded-lg bg-claude-primary/10 text-claude-primary hover:bg-claude-primary/20 transition-colors"
        >
          Usar
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="p-1 rounded-lg text-claude-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

function AddTemplateForm({ onAdd }: { onAdd: (name: string, content: string) => void }) {
  const [name, setName] = useState('')
  const [content, setContent] = useState('')

  const handleAdd = () => {
    if (!name.trim() || !content.trim()) return
    onAdd(name.trim(), content.trim())
    setName('')
    setContent('')
  }

  return (
    <div className="space-y-2 pt-3 border-t border-claude-border">
      <p className="text-claude-muted text-xs font-medium uppercase tracking-wide">Novo template</p>
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Nome do template"
        className="w-full bg-claude-bg border border-claude-border rounded-xl px-3 py-2 text-claude-text text-sm outline-none focus:border-claude-primary/50"
      />
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Conteúdo do template..."
        rows={3}
        className="w-full bg-claude-bg border border-claude-border rounded-xl px-3 py-2 text-claude-text text-sm outline-none focus:border-claude-primary/50 resize-none"
      />
      <button
        type="button"
        onClick={handleAdd}
        disabled={!name.trim() || !content.trim()}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-claude-primary/10 text-claude-primary text-sm hover:bg-claude-primary/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Plus className="w-3.5 h-3.5" />
        Adicionar
      </button>
    </div>
  )
}

export default function PromptTemplatesModal({ onClose, onUse }: Props) {
  const { templates, addTemplate, deleteTemplate } = usePromptTemplates()

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-claude-surface border border-claude-border rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-claude-border flex-shrink-0">
          <LayoutTemplate className="w-4 h-4 text-claude-muted" />
          <span className="text-claude-text font-semibold text-sm flex-1">Templates de prompt</span>
          <button type="button" onClick={onClose} className="p-1 text-claude-muted hover:text-claude-text transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
          {templates.length === 0 && (
            <p className="text-claude-muted text-sm text-center py-4">Nenhum template ainda.</p>
          )}
          {templates.map(t => (
            <TemplateItem
              key={t.id}
              template={t}
              onUse={() => { onUse(t.content); onClose() }}
              onDelete={() => deleteTemplate(t.id)}
            />
          ))}
        </div>
        <div className="p-4 flex-shrink-0">
          <AddTemplateForm onAdd={addTemplate} />
        </div>
      </div>
    </div>
  )
}
