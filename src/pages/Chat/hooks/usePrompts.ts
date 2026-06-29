import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  useChatSessionsControllerGetPrompts,
  usePromptsControllerCreate,
  usePromptsControllerDeleteById,
  usePromptsControllerUpdateById,
  getChatSessionsControllerGetPromptsQueryKey,
  getChatSessionsControllerFindQueryKey,
  useProjectsControllerFindById,
} from '../../../api/generated/api'
import type { ChatSessionsControllerFind200Item, ChatSessionsControllerGetPrompts200Item } from '../../../api/generated/models'
import { useWebSocket, type WsPromptUpdate } from './useWebSocket'

const PENDING_STATUSES = new Set(['queued', 'executing'])
const POLL_INTERVAL_MS = 2000

function hasPendingPrompts(data: ChatSessionsControllerGetPrompts200Item[] | undefined): boolean {
  return (data ?? []).some(p => PENDING_STATUSES.has(p.status ?? ''))
}

export function usePrompts(session: ChatSessionsControllerFind200Item | null) {
  const chatName = session?.chatName ?? ''
  const queryClient = useQueryClient()

  const { data: project } = useProjectsControllerFindById(session?.projectId ?? 0, {
    query: { enabled: !!session?.projectId },
  })

  const { data: prompts = [], isLoading, refetch: refetchPrompts } = useChatSessionsControllerGetPrompts(chatName, {
    query: {
      enabled: !!chatName,
      refetchInterval: (data) => hasPendingPrompts(data) ? POLL_INTERVAL_MS : false,
    },
  })

  const handleWsUpdate = useCallback((data: WsPromptUpdate) => {
    const targetChat = data.chatName ?? chatName
    const queryKey = getChatSessionsControllerGetPromptsQueryKey(targetChat)
    void queryClient.refetchQueries({ queryKey, type: 'all' })
  }, [queryClient, chatName])

  useWebSocket(handleWsUpdate, !!chatName)

  const { mutateAsync: createPromptMutation, isLoading: isSending } = usePromptsControllerCreate()
  const { mutateAsync: deletePromptMutation } = usePromptsControllerDeleteById()
  const { mutateAsync: updatePromptMutation } = usePromptsControllerUpdateById()

  const sendPrompt = async (content: string, contextFiles: string[] = [], claudeModel: string | null = null, waitForPromptId: number | null = null, useWaitResponse = false): Promise<void> => {
    await createPromptMutation({
      data: {
        content,
        workingDirectory: project?.workDir ?? '',
        chatName,
        contextFiles,
        claudeModel,
        waitForPromptId,
        useWaitResponse,
      },
    })
    queryClient.invalidateQueries({
      queryKey: getChatSessionsControllerGetPromptsQueryKey(chatName),
    })
    queryClient.invalidateQueries({
      queryKey: getChatSessionsControllerFindQueryKey(),
    })
  }

  const deletePrompt = async (id: number): Promise<void> => {
    await deletePromptMutation({ id })
    queryClient.invalidateQueries({
      queryKey: getChatSessionsControllerGetPromptsQueryKey(chatName),
    })
  }

  const deleteMultiple = async (ids: ReadonlySet<number>): Promise<void> => {
    await Promise.all([...ids].map(id => deletePromptMutation({ id })))
    queryClient.invalidateQueries({
      queryKey: getChatSessionsControllerGetPromptsQueryKey(chatName),
    })
  }

  const cancelPrompt = async (id: number): Promise<void> => {
    await updatePromptMutation({ id, data: { status: 'cancelled' } })
    queryClient.invalidateQueries({
      queryKey: getChatSessionsControllerGetPromptsQueryKey(chatName),
    })
  }

  return { prompts, isLoading, sendPrompt, isSending, refetchPrompts, deletePrompt, deleteMultiple, cancelPrompt }
}
