import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import { useClaudeApiKeys } from './hooks/useClaudeApiKeys'
import ClaudeApiKeyModal from './components/ClaudeApiKeyModal'
import ClaudeApiKeysTable from './components/ClaudeApiKeysTable'
import RotationHeader from './components/RotationHeader'
import type { ClaudeCodeApiKey } from '../../api/generated/models'

export default function ClaudeApiKeys() {
  return <ClaudeApiKeysContent />
}

function ClaudeApiKeysContent() {
  const navigate = useNavigate()
  const {
    apiKeys, isLoading,
    activeApiKeyId,
    createApiKey, isCreating,
    updateApiKey, isUpdating,
    deleteApiKey, isDeleting,
    activateApiKey, isActivating,
    toggleRotation, isTogglingRotation,
  } = useClaudeApiKeys()

  const [editingKey, setEditingKey] = useState<ClaudeCodeApiKey | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const handleCreate = async (data: { name: string; keyValue: string }) => {
    await createApiKey({ name: data.name, keyValue: data.keyValue })
    setShowCreateModal(false)
  }

  const handleUpdate = async (data: { name: string }) => {
    if (!editingKey?.id) return
    await updateApiKey(editingKey.id, { name: data.name })
    setEditingKey(null)
  }

  const handleDelete = async (id: number) => {
    await deleteApiKey(id)
  }

  return (
    <div className="min-h-screen bg-claude-bg">
      <div className="border-b border-claude-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-claude-muted hover:text-claude-text transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-claude-text font-semibold">Contas do Claude</h1>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-claude-primary/10 hover:bg-claude-primary/20 border border-claude-primary/30 rounded-lg text-claude-primary text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Conta
        </button>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <RotationHeader />
        <div className="bg-claude-surface rounded-xl border border-claude-border overflow-hidden">
          <ClaudeApiKeysTable
            apiKeys={apiKeys}
            activeApiKeyId={activeApiKeyId}
            isLoading={isLoading}
            onEdit={setEditingKey}
            onDelete={handleDelete}
            onActivate={activateApiKey}
            onToggleRotation={toggleRotation}
            isDeleting={isDeleting}
            isActivating={isActivating}
            isTogglingRotation={isTogglingRotation}
          />
        </div>
      </div>

      {showCreateModal && (
        <ClaudeApiKeyModal
          onConfirm={handleCreate}
          onClose={() => setShowCreateModal(false)}
          isLoading={isCreating}
        />
      )}

      {editingKey && (
        <ClaudeApiKeyModal
          apiKey={editingKey}
          onConfirm={handleUpdate}
          onClose={() => setEditingKey(null)}
          isLoading={isUpdating}
        />
      )}
    </div>
  )
}
