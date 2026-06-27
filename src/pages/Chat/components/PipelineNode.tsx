import { Handle, Position } from '@xyflow/react'
import type { NodeProps, Node } from '@xyflow/react'
import { useState } from 'react'
import { CheckCircle, XCircle, Loader2, Clock, Ban, Gauge, ArrowRightFromLine } from 'lucide-react'
import type { Prompt } from '../../../api/generated/models'

const CONTENT_PREVIEW = 90

type StatusStyle = { icon: React.ReactNode; border: string; badge: string }

const STATUS_STYLES: Record<string, StatusStyle> = {
  draft:        { icon: <Clock className="w-3 h-3" />,                    border: 'border-claude-border border-dashed', badge: 'bg-claude-border text-claude-muted' },
  queued:       { icon: <Clock className="w-3 h-3" />,                    border: 'border-claude-border',     badge: 'bg-claude-border text-claude-muted' },
  executing:    { icon: <Loader2 className="w-3 h-3 animate-spin" />,     border: 'border-claude-primary',    badge: 'bg-claude-primary/20 text-claude-primary' },
  completed:    { icon: <CheckCircle className="w-3 h-3" />,              border: 'border-green-500/50',      badge: 'bg-green-500/20 text-green-400' },
  failed:       { icon: <XCircle className="w-3 h-3" />,                  border: 'border-red-500/50',        badge: 'bg-red-500/20 text-red-400' },
  cancelled:    { icon: <Ban className="w-3 h-3" />,                      border: 'border-claude-border',     badge: 'bg-claude-border text-claude-muted' },
  rate_limited: { icon: <Gauge className="w-3 h-3" />,                    border: 'border-yellow-500/50',     badge: 'bg-yellow-500/20 text-yellow-400' },
}

const DEFAULT_STYLE: StatusStyle = STATUS_STYLES['queued'] as StatusStyle

function contentPreview(content: string | undefined): string {
  if (!content) return '(sem conteúdo)'
  return content.length > CONTENT_PREVIEW ? `${content.slice(0, CONTENT_PREVIEW)}…` : content
}

export type PromptNodeData = {
  prompt: Prompt
  onTogglePipeOutput?: (promptId: number, value: boolean) => Promise<void>
}
export type PromptFlowNode = Node<PromptNodeData, 'promptNode'>

function PipeOutputToggle({ prompt, onToggle }: { prompt: Prompt; onToggle?: (value: boolean) => Promise<void> }) {
  const [localActive, setLocalActive] = useState<boolean | null>(null)
  const active = localActive ?? (prompt.useWaitResponse ?? false)

  console.log(`[PipeOutputToggle #${prompt.id}] render — localActive=${JSON.stringify(localActive)} useWaitResponse=${JSON.stringify(prompt.useWaitResponse)} active=${active}`)

  const toggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const next = !active
    console.log(`[PipeOutputToggle #${prompt.id}] toggle → ${next}`)
    setLocalActive(next)
    try {
      await onToggle?.(next)
      console.log(`[PipeOutputToggle #${prompt.id}] API ok`)
    } catch (err) {
      console.error(`[PipeOutputToggle #${prompt.id}] API error`, err)
      setLocalActive(!next)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      onMouseDown={e => e.stopPropagation()}
      title={active ? 'Saída sendo injetada — clique para desativar' : 'Ativar injeção de saída do prompt pai'}
      className={`nodrag inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
        active
          ? 'bg-claude-primary/20 text-claude-primary border border-claude-primary/40'
          : 'bg-claude-border text-claude-muted border border-transparent hover:border-claude-primary/30 hover:text-claude-primary'
      }`}
    >
      <ArrowRightFromLine className="w-2.5 h-2.5" />
      {active ? 'saída ativa' : 'usar saída'}
    </button>
  )
}

export default function PipelineNode({ data }: NodeProps<PromptFlowNode>) {
  const { prompt, onTogglePipeOutput } = data
  const status = prompt.status ?? 'queued'
  const style = STATUS_STYLES[status] ?? DEFAULT_STYLE

  const handleToggle = prompt.id != null && onTogglePipeOutput
    ? (value: boolean) => onTogglePipeOutput(prompt.id!, value)
    : undefined

  return (
    <div className={`bg-claude-surface border-2 ${style.border} rounded-xl p-3 w-60 shadow-md`}>
      <Handle type="target" position={Position.Left} className="!bg-claude-primary !border-claude-bg !w-2.5 !h-2.5" />

      <div className="flex items-center gap-1.5 mb-2">
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${style.badge}`}>
          {style.icon}
          {status}
        </span>
        <span className="ml-auto text-claude-muted text-[10px] font-mono">#{prompt.id}</span>
      </div>

      <p className="text-claude-text text-xs leading-relaxed">{contentPreview(prompt.content)}</p>

      {prompt.waitForPromptId != null && (
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-claude-primary/70">↩ aguarda #{prompt.waitForPromptId}</span>
          <PipeOutputToggle prompt={prompt} onToggle={handleToggle} />
        </div>
      )}

      {prompt.diff && (
        <span className="mt-2 inline-block text-[10px] text-green-400 bg-green-500/10 rounded px-1.5 py-0.5">
          git diff
        </span>
      )}

      <Handle type="source" position={Position.Right} className="!bg-claude-primary !border-claude-bg !w-2.5 !h-2.5" />
    </div>
  )
}
