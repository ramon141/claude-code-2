import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripHorizontal, X } from 'lucide-react'
import { cn } from '../../../lib/utils'
import ChatArea from './ChatArea'
import type { ChatSessionsControllerFind200Item } from '../../../api/generated/models'

interface Props {
  panelId: string
  session: ChatSessionsControllerFind200Item | null
  isFocused: boolean
  canClose: boolean
  isColSpan2: boolean
  onFocus: () => void
  onClose: () => void
  onOpenSidebar: () => void
}

export default function SortablePanel({
  panelId,
  session,
  isFocused,
  canClose,
  isColSpan2,
  onFocus,
  onClose,
  onOpenSidebar,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: panelId })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'flex flex-col overflow-hidden min-h-0',
        isFocused && 'ring-2 ring-inset ring-claude-primary',
        isDragging && 'opacity-40 z-50',
        isColSpan2 && 'col-span-2',
      )}
      onClick={onFocus}
      {...attributes}
    >
      <div
        className={cn(
          'flex items-center h-6 px-2 border-b cursor-grab active:cursor-grabbing flex-shrink-0 select-none',
          isFocused
            ? 'bg-claude-primary/15 border-claude-primary/50'
            : 'bg-claude-surface border-claude-border',
        )}
        {...listeners}
      >
        <GripHorizontal className="w-3.5 h-3.5 text-claude-muted" />
        {canClose && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onClose() }}
            className="ml-auto p-0.5 rounded text-claude-muted hover:text-red-400 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
      <ChatArea session={session} onOpenSidebar={onOpenSidebar} />
    </div>
  )
}
