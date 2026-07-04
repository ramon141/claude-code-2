import { useMemo } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable'
import { cn } from '../../../lib/utils'
import SortablePanel from './SortablePanel'
import type { ChatSessionsControllerFind200Item } from '../../../api/generated/models'
import type { LayoutType } from '../types/layout'
import { LAYOUT_GRID_CLASS } from '../types/layout'

const PANEL_IDS = ['panel-0', 'panel-1', 'panel-2', 'panel-3'] as const

type PanelSession = ChatSessionsControllerFind200Item | null

interface Props {
  panels: PanelSession[]
  layout: LayoutType
  activePanelIndex: number
  onPanelsChange: (panels: PanelSession[]) => void
  onActivePanelChange: (index: number) => void
  onClosePanel: (index: number) => void
  onOpenSidebar: (panelIndex: number) => void
}

export default function SplitChatLayout({
  panels,
  layout,
  activePanelIndex,
  onPanelsChange,
  onActivePanelChange,
  onClosePanel,
  onOpenSidebar,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  const panelIds = useMemo(() => PANEL_IDS.slice(0, panels.length), [panels.length])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = panelIds.indexOf(active.id as typeof PANEL_IDS[number])
    const newIndex = panelIds.indexOf(over.id as typeof PANEL_IDS[number])
    if (oldIndex === -1 || newIndex === -1) return
    onPanelsChange(arrayMove(panels, oldIndex, newIndex))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={panelIds as unknown as string[]} strategy={rectSortingStrategy}>
        <div className={cn('flex-1 grid gap-px bg-claude-border overflow-hidden min-h-0', LAYOUT_GRID_CLASS[layout])}>
          {panels.map((session, index) => {
            const pid = PANEL_IDS[index] ?? `panel-${index}`
            return (
              <SortablePanel
                key={pid}
                panelId={pid}
                session={session}
                isFocused={activePanelIndex === index}
                canClose={panels.length > 1}
                isColSpan2={layout === 'three' && index === 2}
                onFocus={() => onActivePanelChange(index)}
                onClose={() => onClosePanel(index)}
                onOpenSidebar={() => onOpenSidebar(index)}
              />
            )
          })}
        </div>
      </SortableContext>
    </DndContext>
  )
}
