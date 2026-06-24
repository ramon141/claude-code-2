import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useClaudeApiKeys } from '../../ClaudeApiKeys/hooks/useClaudeApiKeys'
import ClaudeApiKeyModal from '../../ClaudeApiKeys/components/ClaudeApiKeyModal'
import ClaudeApiKeysTable from '../../ClaudeApiKeys/components/ClaudeApiKeysTable'
import RotationHeader from '../../ClaudeApiKeys/components/RotationHeader'
import type { ClaudeCodeApiKey } from '../../../api/generated/models'

function AccountModals({
  showCreate,
  editingKey,
  isCreating,
  isUpdating,
  onCreate,
  onUpdate,
  onCloseCreate,
  onCloseEdit,
}: {
  showCreate: boolean
  editingKey: ClaudeCodeApiKey | null
  isCreating: boolean
  isUpdating: boolean
  onCreate: (data: { name: string; keyValue: string }) => Promise<void>
  onUpdate: (data: { name: string }) => Promise<void>
  onCloseCreate: () => void
  onCloseEdit: () => void
}) {
  return (
    <>
      {showCreate && (
        <ClaudeApiKeyModal onConfirm={onCreate} onClose={onCloseCreate} isLoading={isCreating} />
      )}
      {editingKey && (
        <ClaudeApiKeyModal apiKey={editingKey} onConfirm={onUpdate} onClose={onCloseEdit} isLoading={isUpdating} />
      )}
    </>
  )
}

export default function ClaudeCodeAccountsTab() {
  const {
    apiKeys, isLoading, activeApiKeyId,
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

  return (
    <div className="space-y-4">
      <RotationHeader />
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D97757]/10 hover:bg-[#D97757]/20 border border-[#D97757]/30 rounded-lg text-[#D97757] text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Conta
        </button>
      </div>
      <div className="bg-[#2A2A2A] rounded-xl border border-[#3A3A3A] overflow-hidden">
        <ClaudeApiKeysTable
          apiKeys={apiKeys}
          activeApiKeyId={activeApiKeyId}
          isLoading={isLoading}
          onEdit={setEditingKey}
          onDelete={deleteApiKey}
          onActivate={activateApiKey}
          onToggleRotation={toggleRotation}
          isDeleting={isDeleting}
          isActivating={isActivating}
          isTogglingRotation={isTogglingRotation}
        />
      </div>
      <AccountModals
        showCreate={showCreateModal}
        editingKey={editingKey}
        isCreating={isCreating}
        isUpdating={isUpdating}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onCloseCreate={() => setShowCreateModal(false)}
        onCloseEdit={() => setEditingKey(null)}
      />
    </div>
  )
}
