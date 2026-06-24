import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  useChatSessionsControllerGetPrompts,
  usePromptsControllerCreate,
  getChatSessionsControllerGetPromptsQueryKey,
  useProjectsControllerFindById,
} from '../../../api/generated/api'
import type { ChatSessionsControllerFind200Item, ChatSessionsControllerGetPrompts200Item } from '../../../api/generated/models'
import { useWebSocket, type WsPromptUpdate } from './useWebSocket'

export function usePrompts(session: ChatSessionsControllerFind200Item | null) {
  const chatName = session?.chatName ?? ''
  const queryClient = useQueryClient()

  const { data: project } = useProjectsControllerFindById(session?.projectId ?? 0, {
    query: { enabled: !!session?.projectId },
  })

  const { data: prompts = [], isLoading } = useChatSessionsControllerGetPrompts(chatName, {
    query: { enabled: !!chatName },
  })

  const handleWsUpdate = useCallback((data: WsPromptUpdate) => {
    queryClient.setQueryData<ChatSessionsControllerGetPrompts200Item[]>(
      getChatSessionsControllerGetPromptsQueryKey(chatName),
      (prev) => {
        if (!prev) return prev
        return prev.map((p) =>
          p.id === data.promptId ? { ...p, status: data.status, output: data.output } : p
        )
      }
    )
  }, [queryClient, chatName])

  useWebSocket(handleWsUpdate, !!chatName)

  const { mutateAsync: createPromptMutation, isLoading: isSending } = usePromptsControllerCreate()

  const sendPrompt = async (content: string): Promise<void> => {
    await createPromptMutation({
      data: {
        content,
        workingDirectory: project?.workDir ?? '',
        chatName,
      },
    })
    queryClient.invalidateQueries({
      queryKey: getChatSessionsControllerGetPromptsQueryKey(chatName),
    })
  }

  return { prompts, isLoading, sendPrompt, isSending }
}
