import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import {
  useClaudeCodeApiKeysControllerFind,
  useClaudeCodeApiKeysControllerCreate,
  useClaudeCodeApiKeysControllerUpdateById,
  useClaudeCodeApiKeysControllerDeleteById,
  useClaudeCodeApiKeysControllerActivate,
  getClaudeCodeApiKeysControllerFindQueryKey,
} from '../../../api/generated/api'
import type {
  ClaudeCodeApiKeysControllerCreateBody,
  ClaudeCodeApiKeysControllerUpdateByIdBody,
} from '../../../api/generated/models'

export function useClaudeApiKeys() {
  const queryClient = useQueryClient()

  const invalidateKeys = () =>
    queryClient.invalidateQueries({ queryKey: getClaudeCodeApiKeysControllerFindQueryKey() })

  const { data: apiKeys = [], isLoading } = useClaudeCodeApiKeysControllerFind()

  const activeApiKeyId = apiKeys.find(k => k.isActive)?.id ?? null

  const { mutateAsync: createMutation, isLoading: isCreating } = useClaudeCodeApiKeysControllerCreate({
    mutation: {
      onSuccess: () => {
        invalidateKeys()
        toast.success('API Key criada com sucesso!')
      },
      onError: () => toast.error('Erro ao criar API Key.'),
    },
  })

  const { mutateAsync: updateMutation, isLoading: isUpdating } = useClaudeCodeApiKeysControllerUpdateById({
    mutation: {
      onSuccess: () => {
        invalidateKeys()
        toast.success('API Key atualizada com sucesso!')
      },
      onError: () => toast.error('Erro ao atualizar API Key.'),
    },
  })

  const { mutateAsync: deleteMutation, isLoading: isDeleting } = useClaudeCodeApiKeysControllerDeleteById({
    mutation: {
      onSuccess: () => {
        invalidateKeys()
        toast.success('API Key removida com sucesso!')
      },
      onError: () => toast.error('Erro ao remover API Key.'),
    },
  })

  const { mutateAsync: activateMutation, isLoading: isActivating } = useClaudeCodeApiKeysControllerActivate({
    mutation: {
      onSuccess: () => {
        invalidateKeys()
        toast.success('API Key ativada com sucesso!')
      },
      onError: () => toast.error('Erro ao ativar API Key.'),
    },
  })

  const createApiKey = (data: ClaudeCodeApiKeysControllerCreateBody) =>
    createMutation({ data })

  const updateApiKey = (id: number, data: ClaudeCodeApiKeysControllerUpdateByIdBody) =>
    updateMutation({ id, data })

  const deleteApiKey = (id: number) =>
    deleteMutation({ id })

  const activateApiKey = (id: number) =>
    activateMutation({ id })

  return {
    apiKeys,
    isLoading,
    activeApiKeyId,
    createApiKey,
    isCreating,
    updateApiKey,
    isUpdating,
    deleteApiKey,
    isDeleting,
    activateApiKey,
    isActivating,
  }
}
