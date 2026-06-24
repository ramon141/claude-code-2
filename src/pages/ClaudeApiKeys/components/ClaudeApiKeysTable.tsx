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
}

function LimitBar({ value, label }: LimitBarProps) {
  if (value === null || value === undefined) {
    return <span className="text-xs text-[#9A9A9A]">—</span>
  }
  const pct = Math.min(Math.max(value, 0), 100)
  return (
    <div className="flex flex-col gap-1 min-w-[60px]">
      <span className="text-xs text-[#9A9A9A]">{label}: {pct.toFixed(1)}%</span>
      <Progress value={pct} />
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
    <tr className="border-b border-[#3A3A3A] last:border-0">
      <td className="px-3 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#D97757]/10 border border-[#D97757]/20 flex items-center justify-center flex-shrink-0">
            <Key className="w-3.5 h-3.5 text-[#D97757]" />
          </div>
          <span className="text-sm text-[#F5F5F5] font-medium truncate max-w-[150px]" title={apiKey.name}>{apiKey.name}</span>
        </div>
      </td>
      <td className="px-3 py-3 text-sm font-mono text-[#9A9A9A]">{maskKey(apiKey.keyValue)}</td>
      <td className="px-3 py-3">
        {isActive ? (
          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
            <CheckCircle className="w-3.5 h-3.5" /> Ativa
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs font-medium text-[#9A9A9A]">
            <XCircle className="w-3.5 h-3.5" /> Inativa
          </span>
        )}
      </td>
      <td className="px-3 py-3 text-sm text-[#9A9A9A]">
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
          <LimitBar value={apiKey.sessionLimitPercentage} label="Sessão" />
          <LimitBar value={apiKey.weeklyLimitPercentage} label="Semanal" />
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
              className="p-1.5 text-[#9A9A9A] hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors disabled:opacity-50"
            >
              <Power className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onEdit(apiKey)}
            className="p-1.5 text-[#9A9A9A] hover:text-[#F5F5F5] hover:bg-white/6 rounded-lg transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => apiKey.id !== undefined && onDelete(apiKey.id)}
            disabled={isDeleting}
            className="p-1.5 text-[#9A9A9A] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
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
        <span className="w-5 h-5 border-2 border-[#D97757] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (apiKeys.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 rounded-xl bg-[#2A2A2A] border border-[#3A3A3A] flex items-center justify-center mb-3">
          <Key className="w-6 h-6 text-[#9A9A9A]" />
        </div>
        <p className="text-[#9A9A9A] text-sm">Nenhuma conta ainda. Adicione a primeira!</p>
      </div>
    )
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-[#3A3A3A]">
          <th className="text-left px-3 py-2.5 text-xs font-semibold text-[#9A9A9A] uppercase tracking-wider">Nome</th>
          <th className="text-left px-3 py-2.5 text-xs font-semibold text-[#9A9A9A] uppercase tracking-wider">Chave</th>
          <th className="text-left px-3 py-2.5 text-xs font-semibold text-[#9A9A9A] uppercase tracking-wider">Status</th>
          <th className="text-left px-3 py-2.5 text-xs font-semibold text-[#9A9A9A] uppercase tracking-wider">Criado em</th>
          <th className="text-left px-3 py-2.5 text-xs font-semibold text-[#9A9A9A] uppercase tracking-wider">Rodízio</th>
          <th className="text-left px-3 py-2.5 text-xs font-semibold text-[#9A9A9A] uppercase tracking-wider">Limites</th>
          <th className="text-right px-3 py-2.5 text-xs font-semibold text-[#9A9A9A] uppercase tracking-wider">Ações</th>
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
