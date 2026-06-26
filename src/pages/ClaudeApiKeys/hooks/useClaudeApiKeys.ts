import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import {
  useClaudeCodeApiKeysControllerFind,
  useClaudeCodeApiKeysControllerCreate,
  useClaudeCodeApiKeysControllerUpdateById,
  useClaudeCodeApiKeysControllerDeleteById,
  useClaudeCodeApiKeysControllerActivate,
  useClaudeCodeApiKeysControllerRefreshAllLimits,
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

  const mutationOpts = (errorMsg: string, successMsg?: string) => ({
    mutation: {
      onSuccess: () => {
        invalidateKeys()
        if (successMsg) toast.success(successMsg)
      },
      onError: () => toast.error(errorMsg),
    },
  })

  const { data: apiKeys = [], isLoading } = useClaudeCodeApiKeysControllerFind()

  const activeApiKeyId = apiKeys.find(k => k.isActive)?.id ?? null

  const { mutateAsync: createMutation, isLoading: isCreating } =
    useClaudeCodeApiKeysControllerCreate(mutationOpts('Erro ao criar API Key.', 'API Key criada com sucesso!'))

  const { mutateAsync: updateMutation, isLoading: isUpdating } =
    useClaudeCodeApiKeysControllerUpdateById(mutationOpts('Erro ao atualizar API Key.', 'API Key atualizada com sucesso!'))

  const { mutateAsync: deleteMutation, isLoading: isDeleting } =
    useClaudeCodeApiKeysControllerDeleteById(mutationOpts('Erro ao remover API Key.', 'API Key removida com sucesso!'))

  const { mutateAsync: activateMutation, isLoading: isActivating } =
    useClaudeCodeApiKeysControllerActivate(mutationOpts('Erro ao ativar API Key.', 'API Key ativada com sucesso!'))

  const { mutateAsync: rotationMutation, isLoading: isTogglingRotation } =
    useClaudeCodeApiKeysControllerUpdateById(mutationOpts('Erro ao atualizar rodízio da conta.'))

  const { mutateAsync: refreshLimitsMutation, isLoading: isRefreshingLimits } =
    useClaudeCodeApiKeysControllerRefreshAllLimits(mutationOpts('Erro ao atualizar limites.'))

  const createApiKey = (data: ClaudeCodeApiKeysControllerCreateBody) =>
    createMutation({ data })

  const updateApiKey = (id: number, data: ClaudeCodeApiKeysControllerUpdateByIdBody) =>
    updateMutation({ id, data })

  const deleteApiKey = (id: number) =>
    deleteMutation({ id })

  const activateApiKey = (id: number) =>
    activateMutation({ id })

  const toggleRotation = (id: number, enabled: boolean) =>
    rotationMutation({ id, data: { rotationEnabled: enabled } })

  const refreshLimits = () => refreshLimitsMutation()

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
    toggleRotation,
    isTogglingRotation,
    refreshLimits,
    isRefreshingLimits,
  }
}
