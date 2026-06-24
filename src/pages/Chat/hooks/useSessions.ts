import { useQueryClient } from '@tanstack/react-query'
import {
  useChatSessionsControllerFind,
  useChatSessionsControllerCreate,
  getChatSessionsControllerFindQueryKey,
} from '../../../api/generated/api'
import type { ChatSessionsControllerCreateBody } from '../../../api/generated/models'

export function useSessions() {
  const queryClient = useQueryClient()

  const { data: sessions = [], isLoading } = useChatSessionsControllerFind()

  const { mutateAsync: createSession, isLoading: isCreating } = useChatSessionsControllerCreate({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getChatSessionsControllerFindQueryKey() })
      },
    },
  })

  const handleCreate = async (data: ChatSessionsControllerCreateBody) => {
    return createSession({ data })
  }

  return {
    sessions,
    isLoading,
    createSession: handleCreate,
    isCreating,
  }
}
