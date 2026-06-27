import type { NodeProps, Node } from '@xyflow/react'

export type ChatHeaderData = { chatName: string; color: string }
export type ChatHeaderFlowNode = Node<ChatHeaderData, 'chatHeader'>

export default function ChatHeaderNode({ data }: NodeProps<ChatHeaderFlowNode>) {
  return (
    <div
      className="px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide pointer-events-none select-none"
      style={{ background: `${data.color}18`, color: data.color, border: `1px solid ${data.color}40` }}
    >
      {data.chatName}
    </div>
  )
}
