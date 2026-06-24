import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import {
  useClaudeCodeApiKeysControllerGetRotation,
  useClaudeCodeApiKeysControllerSetRotation,
  getClaudeCodeApiKeysControllerGetRotationQueryKey,
} from '../../../api/generated/api'

export function useAccountRotation() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useClaudeCodeApiKeysControllerGetRotation()
  const enabled = data?.enabled ?? false

  const { mutateAsync, isLoading: isUpdating } = useClaudeCodeApiKeysControllerSetRotation({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getClaudeCodeApiKeysControllerGetRotationQueryKey(),
        })
      },
      onError: () => toast.error('Erro ao atualizar rodízio de contas.'),
    },
  })

  const setEnabled = (next: boolean) => mutateAsync({ data: { enabled: next } })

  return { enabled, isLoading, setEnabled, isUpdating }
}
