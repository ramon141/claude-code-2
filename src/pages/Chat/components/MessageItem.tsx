import { CheckCircle, XCircle, Loader2, Clock, Ban, Gauge } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ChatSessionsControllerGetPrompts200Item } from '../../../api/generated/models'

interface Props {
  prompt: ChatSessionsControllerGetPrompts200Item
}

type KnownStatus = 'queued' | 'executing' | 'completed' | 'failed' | 'cancelled' | 'rate_limited'

interface StatusConfig {
  icon: React.ReactNode
  label: string
  className: string
}

const STATUS_CONFIG: Record<KnownStatus, StatusConfig> = {
  queued: {
    icon: <Clock className="w-3.5 h-3.5" />,
    label: 'Na fila',
    className: 'bg-[#3A3A3A] text-[#9A9A9A]',
  },
  executing: {
    icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
    label: 'Executando',
    className: 'bg-[#D97757]/20 text-[#D97757]',
  },
  completed: {
    icon: <CheckCircle className="w-3.5 h-3.5" />,
    label: 'Concluído',
    className: 'bg-green-500/20 text-green-400',
  },
  failed: {
    icon: <XCircle className="w-3.5 h-3.5" />,
    label: 'Falhou',
    className: 'bg-red-500/20 text-red-400',
  },
  cancelled: {
    icon: <Ban className="w-3.5 h-3.5" />,
    label: 'Cancelado',
    className: 'bg-[#3A3A3A] text-[#9A9A9A]',
  },
  rate_limited: {
    icon: <Gauge className="w-3.5 h-3.5" />,
    label: 'Rate limit',
    className: 'bg-yellow-500/20 text-yellow-400',
  },
}

const KNOWN_STATUSES: KnownStatus[] = ['queued', 'executing', 'completed', 'failed', 'cancelled', 'rate_limited']

function isKnownStatus(s: string): s is KnownStatus {
  return (KNOWN_STATUSES as string[]).includes(s)
}

function StatusBadge({ status }: { status?: string }) {
  if (!status) return null
  if (!isKnownStatus(status)) return null
  const config = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}>
      {config.icon}
      {config.label}
    </span>
  )
}

function isActive(status?: string): boolean {
  return status === 'queued' || status === 'executing'
}

export default function MessageItem({ prompt }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-[#D97757]/20 border border-[#D97757]/30 rounded-2xl rounded-tr-sm px-4 py-3">
          <p className="text-[#F5F5F5] text-sm whitespace-pre-wrap">{prompt.content}</p>
        </div>
      </div>

      <div className="flex justify-start">
        <div className="max-w-[90%] space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#D97757] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">C</span>
            </div>
            <StatusBadge status={prompt.status} />
          </div>

          {prompt.output && (
            <div className="bg-[#2A2A2A] border border-[#3A3A3A] rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="prose prose-invert prose-sm max-w-none
                prose-p:text-[#F5F5F5] prose-p:leading-relaxed prose-p:my-1
                prose-headings:text-[#F5F5F5] prose-headings:font-semibold
                prose-h1:text-lg prose-h2:text-base prose-h3:text-sm
                prose-strong:text-[#F5F5F5] prose-em:text-[#D0D0D0]
                prose-code:text-[#D97757] prose-code:bg-[#1A1A1A] prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
                prose-pre:bg-[#1A1A1A] prose-pre:border prose-pre:border-[#3A3A3A] prose-pre:rounded-lg prose-pre:p-3 prose-pre:overflow-x-auto
                prose-pre:text-xs prose-pre:font-mono prose-pre:leading-relaxed
                prose-ul:text-[#F5F5F5] prose-ul:my-1 prose-li:my-0.5
                prose-ol:text-[#F5F5F5] prose-ol:my-1
                prose-blockquote:border-l-[#D97757] prose-blockquote:text-[#9A9A9A] prose-blockquote:my-2
                prose-hr:border-[#3A3A3A]
                prose-a:text-[#D97757] prose-a:no-underline hover:prose-a:underline
                prose-table:text-[#F5F5F5] prose-th:border-[#3A3A3A] prose-td:border-[#3A3A3A]">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {prompt.output}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {isActive(prompt.status) && !prompt.output && (
            <div className="bg-[#2A2A2A] border border-[#3A3A3A] rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#9A9A9A] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#9A9A9A] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#9A9A9A] animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
