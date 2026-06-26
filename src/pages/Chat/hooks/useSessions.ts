import { useQueryClient } from '@tanstack/react-query'
import {
  useChatSessionsControllerFind,
  useChatSessionsControllerCreate,
  useChatSessionsControllerDeleteByChatName,
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

  const { mutateAsync: deleteSessionMutation, isLoading: isDeleting } =
    useChatSessionsControllerDeleteByChatName({
      mutation: {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getChatSessionsControllerFindQueryKey() })
        },
      },
    })

  const handleCreate = async (data: ChatSessionsControllerCreateBody) => {
    return createSession({ data })
  }

  const handleDelete = async (chatName: string) => {
    await deleteSessionMutation({ chatName })
  }

  return {
    sessions,
    isLoading,
    createSession: handleCreate,
    isCreating,
    deleteSession: handleDelete,
    isDeleting,
  }
}
