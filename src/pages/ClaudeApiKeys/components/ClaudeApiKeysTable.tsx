import { Pencil, Trash2, Key, CheckCircle, XCircle, Power } from 'lucide-react'
import type { ClaudeCodeApiKey } from '../../../api/generated/models'
import { Progress } from '../../../components/ui/Progress'
import { Switch } from '../../../components/ui/Switch'

function maskKey(value: string | undefined) {
  if (!value) return '••••••••'
  if (value.length <= 8) return '••••••••'
  return value.slice(0, 6) + '••••••••' + value.slice(-4)
}

interface LimitBarProps {
  value: number | null | undefined
  label: string
  resetAt: string | null | undefined
}

function formatResetAt(resetAt: string): string {
  const date = new Date(resetAt)
  const isToday = date.toDateString() === new Date().toDateString()
  const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return isToday ? `reseta às ${time}` : `reseta em ${date.toLocaleDateString('pt-BR')} ${time}`
}

function LimitBar({ value, label, resetAt }: LimitBarProps) {
  if (value === null || value === undefined) {
    return <span className="text-xs text-claude-muted">—</span>
  }
  const pct = Math.min(Math.max(value, 0), 100)
  return (
    <div className="flex flex-col gap-1 min-w-[60px]">
      <span className="text-xs text-claude-muted">{label}: {pct.toFixed(1)}%</span>
      <Progress value={pct} />
      {resetAt && <span className="text-[10px] text-claude-muted">{formatResetAt(resetAt)}</span>}
    </div>
  )
}

interface RowProps {
  apiKey: ClaudeCodeApiKey
  isActive: boolean
  onEdit: (apiKey: ClaudeCodeApiKey) => void
  onDelete: (id: number) => void
  onActivate: (id: number) => void
  onToggleRotation: (id: number, enabled: boolean) => void
  isDeleting: boolean
  isActivating: boolean
  isTogglingRotation: boolean
}

function ApiKeyRow({ apiKey, isActive, onEdit, onDelete, onActivate, onToggleRotation, isDeleting, isActivating, isTogglingRotation }: RowProps) {
  return (
    <tr className="border-b border-claude-border last:border-0">
      <td className="px-3 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-claude-primary/10 border border-claude-primary/20 flex items-center justify-center flex-shrink-0">
            <Key className="w-3.5 h-3.5 text-claude-primary" />
          </div>
          <span className="text-sm text-claude-text font-medium truncate max-w-[150px]" title={apiKey.name}>{apiKey.name}</span>
        </div>
      </td>
      <td className="px-3 py-3 text-sm font-mono text-claude-muted">{maskKey(apiKey.keyValue)}</td>
      <td className="px-3 py-3">
        {isActive ? (
          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
            <CheckCircle className="w-3.5 h-3.5" /> Ativa
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs font-medium text-claude-muted">
            <XCircle className="w-3.5 h-3.5" /> Inativa
          </span>
        )}
      </td>
      <td className="px-3 py-3 text-sm text-claude-muted">
        {apiKey.createdAt ? new Date(apiKey.createdAt).toLocaleDateString('pt-BR') : '—'}
      </td>
      <td className="px-3 py-3">
        <Switch
          checked={apiKey.rotationEnabled ?? false}
          disabled={isTogglingRotation || apiKey.id === undefined}
          label="Incluir no rodízio"
          onChange={(next) => apiKey.id !== undefined && onToggleRotation(apiKey.id, next)}
        />
      </td>
      <td className="px-3 py-3">
        <div className="flex flex-col gap-2">
          <LimitBar value={apiKey.sessionLimitPercentage} label="Sessão" resetAt={apiKey.sessionResetAt} />
          <LimitBar value={apiKey.weeklyLimitPercentage} label="Semanal" resetAt={apiKey.weeklyResetAt} />
        </div>
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center justify-end gap-1">
          {!isActive && (
            <button
              type="button"
              onClick={() => apiKey.id !== undefined && onActivate(apiKey.id)}
              disabled={isActivating}
              title="Ativar"
              className="p-1.5 text-claude-muted hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors disabled:opacity-50"
            >
              <Power className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onEdit(apiKey)}
            className="p-1.5 text-claude-muted hover:text-claude-text hover:bg-white/6 rounded-lg transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => apiKey.id !== undefined && onDelete(apiKey.id)}
            disabled={isDeleting}
            className="p-1.5 text-claude-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  )
}

interface Props {
  apiKeys: ClaudeCodeApiKey[]
  activeApiKeyId: number | null
  isLoading: boolean
  onEdit: (apiKey: ClaudeCodeApiKey) => void
  onDelete: (id: number) => void
  onActivate: (id: number) => void
  onToggleRotation: (id: number, enabled: boolean) => void
  isDeleting: boolean
  isActivating: boolean
  isTogglingRotation: boolean
}

export default function ClaudeApiKeysTable({ apiKeys, activeApiKeyId, isLoading, onEdit, onDelete, onActivate, onToggleRotation, isDeleting, isActivating, isTogglingRotation }: Props) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="w-5 h-5 border-2 border-claude-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (apiKeys.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 rounded-xl bg-claude-surface border border-claude-border flex items-center justify-center mb-3">
          <Key className="w-6 h-6 text-claude-muted" />
        </div>
        <p className="text-claude-muted text-sm">Nenhuma conta ainda. Adicione a primeira!</p>
      </div>
    )
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-claude-border">
          <th className="text-left px-3 py-2.5 text-xs font-semibold text-claude-muted uppercase tracking-wider">Nome</th>
          <th className="text-left px-3 py-2.5 text-xs font-semibold text-claude-muted uppercase tracking-wider">Chave</th>
          <th className="text-left px-3 py-2.5 text-xs font-semibold text-claude-muted uppercase tracking-wider">Status</th>
          <th className="text-left px-3 py-2.5 text-xs font-semibold text-claude-muted uppercase tracking-wider">Criado em</th>
          <th className="text-left px-3 py-2.5 text-xs font-semibold text-claude-muted uppercase tracking-wider">Rodízio</th>
          <th className="text-left px-3 py-2.5 text-xs font-semibold text-claude-muted uppercase tracking-wider">Limites</th>
          <th className="text-right px-3 py-2.5 text-xs font-semibold text-claude-muted uppercase tracking-wider">Ações</th>
        </tr>
      </thead>
      <tbody>
        {apiKeys.map((apiKey) => (
          <ApiKeyRow
            key={apiKey.id}
            apiKey={apiKey}
            isActive={apiKey.id === activeApiKeyId}
            onEdit={onEdit}
            onDelete={onDelete}
            onActivate={onActivate}
            onToggleRotation={onToggleRotation}
            isDeleting={isDeleting}
            isActivating={isActivating}
            isTogglingRotation={isTogglingRotation}
          />
        ))}
      </tbody>
    </table>
  )
}
