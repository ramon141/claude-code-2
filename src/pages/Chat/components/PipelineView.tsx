import { useCallback, useEffect, useMemo } from 'react'
import {
  ReactFlow, Background, Controls, MiniMap,
  useNodesState, useEdgesState, BackgroundVariant,
} from '@xyflow/react'
import type { Connection, Edge, Node, NodeMouseHandler } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import PipelineNode from './PipelineNode'
import type { PromptFlowNode } from './PipelineNode'
import ChatHeaderNode from './ChatHeaderNode'
import type { ChatHeaderFlowNode } from './ChatHeaderNode'
import PipelineEdge from './PipelineEdge'
import type { Prompt } from '../../../api/generated/models'
import { usePromptsControllerUpdateById } from '../../../api/generated/api'

const NODE_W = 260
const NODE_H = 160
const COL_W = NODE_W + 80
const ROW_GAP = 20
const HEADER_H = 50
const CHAT_COLORS = ['#D97757', '#4CAF50', '#2196F3', '#9C27B0', '#FF9800', '#00BCD4', '#E91E63', '#009688']
const NODE_TYPES = { promptNode: PipelineNode, chatHeader: ChatHeaderNode }
const EDGE_TYPES = { pipeline: PipelineEdge }

function chatColor(index: number): string {
  return CHAT_COLORS[index % CHAT_COLORS.length] ?? CHAT_COLORS[0]!
}

function groupByChat(prompts: Prompt[]): Map<string, Prompt[]> {
  const map = new Map<string, Prompt[]>()
  for (const p of prompts) {
    const key = p.chatName ?? '(sem chat)'
    const list = map.get(key) ?? []
    list.push(p)
    map.set(key, list)
  }
  return map
}

type BuildNodesOptions = {
  onTogglePipeOutput: (promptId: number, value: boolean) => Promise<void>
}

function buildAllNodes(
  prompts: Prompt[],
  opts: BuildNodesOptions,
): (PromptFlowNode | ChatHeaderFlowNode)[] {
  const groups = groupByChat(prompts)
  const nodes: (PromptFlowNode | ChatHeaderFlowNode)[] = []
  let colIdx = 0

  for (const [chatName, chatPrompts] of groups.entries()) {
    const x = colIdx * COL_W
    const color = chatColor(colIdx)
    nodes.push({
      id: `chat-${chatName}`,
      type: 'chatHeader' as const,
      position: { x, y: 0 },
      data: { chatName, color },
      draggable: false,
      selectable: false,
    })
    chatPrompts.forEach((p, rowIdx) => {
      if (p.id == null) return
      nodes.push({
        id: String(p.id),
        type: 'promptNode' as const,
        position: { x, y: HEADER_H + rowIdx * (NODE_H + ROW_GAP) },
        data: { prompt: p, onTogglePipeOutput: opts.onTogglePipeOutput },
      })
    })
    colIdx++
  }
  return nodes
}

function buildEdges(prompts: Prompt[]): Edge[] {
  return prompts
    .filter(p => p.id != null && p.waitForPromptId != null)
    .map(p => ({
      id: `e-${p.waitForPromptId}-${p.id}`,
      type: 'pipeline' as const,
      source: String(p.waitForPromptId),
      target: String(p.id!),
      animated: p.status === 'executing',
      data: { pipeOutput: p.useWaitResponse ?? false },
    }))
}

interface Props {
  prompts: Prompt[]
  onUpdated: () => void
  onPaneContextMenu?: (e: React.MouseEvent | MouseEvent) => void
  onPaneClick?: () => void
  onNodeClick?: (prompt: Prompt) => void
  onNodeContextMenu?: (prompt: Prompt, x: number, y: number) => void
}

export default function PipelineView({ prompts, onUpdated, onPaneContextMenu, onPaneClick, onNodeClick, onNodeContextMenu }: Props) {
  const { mutateAsync: updatePrompt } = usePromptsControllerUpdateById()

  const handleTogglePipeOutput = useCallback(async (promptId: number, value: boolean) => {
    await updatePrompt({ id: promptId, data: { useWaitResponse: value } })
    setEdges(prev => prev.map(e =>
      e.target === String(promptId)
        ? { ...e, data: { ...(e.data ?? {}), pipeOutput: value } }
        : e
    ))
  }, [updatePrompt]) // eslint-disable-line react-hooks/exhaustive-deps

  const buildOpts = useMemo(() => ({ onTogglePipeOutput: handleTogglePipeOutput }), [handleTogglePipeOutput])

  const initialNodes = useMemo(() => buildAllNodes(prompts, buildOpts), []) // eslint-disable-line react-hooks/exhaustive-deps
  const initialEdges = useMemo(() => buildEdges(prompts), []) // eslint-disable-line react-hooks/exhaustive-deps

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  useEffect(() => {
    console.log('[PipelineView] useEffect prompts changed, rebuilding nodes/edges')
    setNodes(prev => {
      const newNodes = buildAllNodes(prompts, buildOpts)
      return newNodes.map(n => {
        const existing = prev.find(e => e.id === n.id)
        return existing ? { ...n, position: existing.position } : n
      })
    })
    setEdges(buildEdges(prompts))
  }, [prompts, setNodes, setEdges]) // eslint-disable-line react-hooks/exhaustive-deps

  const onConnect = useCallback(async (connection: Connection) => {
    if (!connection.source || !connection.target) return
    const targetId = parseInt(connection.target)
    const sourceId = parseInt(connection.source)
    if (isNaN(targetId) || isNaN(sourceId) || targetId === sourceId) return
    await updatePrompt({ id: targetId, data: { waitForPromptId: sourceId } })
    onUpdated()
  }, [updatePrompt, onUpdated])

  const handleNodeContextMenu: NodeMouseHandler = useCallback((e, node) => {
    e.preventDefault()
    if (node.type !== 'promptNode') return
    const flowNode = node as PromptFlowNode
    onNodeContextMenu?.(flowNode.data.prompt, e.clientX, e.clientY)
  }, [onNodeContextMenu])

  const handleNodeClick: NodeMouseHandler = useCallback((_e, node) => {
    if (node.type !== 'promptNode') return
    const flowNode = node as PromptFlowNode
    onNodeClick?.(flowNode.data.prompt)
  }, [onNodeClick])

  const onEdgesDelete = useCallback(async (deleted: Edge[]) => {
    for (const edge of deleted) {
      const targetId = parseInt(edge.target)
      if (isNaN(targetId)) continue
      await updatePrompt({ id: targetId, data: { waitForPromptId: null } })
    }
    onUpdated()
  }, [updatePrompt, onUpdated])

  if (prompts.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-claude-muted text-sm">
        Nenhum prompt para exibir.
      </div>
    )
  }

  return (
    <div className="flex-1 w-full" style={{ minHeight: 0 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgesDelete={onEdgesDelete}
        deleteKeyCode="Delete"
        onPaneClick={onPaneClick}
        onPaneContextMenu={onPaneContextMenu}
        onNodeContextMenu={handleNodeContextMenu}
        onNodeClick={handleNodeClick}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        colorMode="dark"
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#333" />
        <Controls showInteractive={false} />
        <MiniMap nodeColor="#D97757" maskColor="rgba(0,0,0,0.6)" />
      </ReactFlow>
    </div>
  )
}
