import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react'
import type { Edge, EdgeProps } from '@xyflow/react'

const COLOR_SELECTED = '#D97757'
const COLOR_PIPE = '#4ade80'
const COLOR_DEFAULT = '#555'

export type PipelineEdgeType = Edge<{ pipeOutput: boolean }, 'pipeline'>

export default function PipelineEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  selected, animated, data,
}: EdgeProps<PipelineEdgeType>) {
  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })
  const pipeOutput = data?.pipeOutput ?? false
  const color = selected ? COLOR_SELECTED : pipeOutput ? COLOR_PIPE : COLOR_DEFAULT
  const markerId = `arrow-${id}`

  return (
    <>
      <defs>
        <marker id={markerId} markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
          <path d="M0,0 L0,6 L9,3 z" fill={color} />
        </marker>
      </defs>

      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: color,
          strokeWidth: selected ? 2.5 : 1.5,
          strokeDasharray: animated ? '6 3' : undefined,
        }}
        markerEnd={`url(#${markerId})`}
      />

      {pipeOutput && (
        <EdgeLabelRenderer>
          <div
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
            className="absolute pointer-events-none"
          >
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-green-500/20 text-green-400 border border-green-500/30 whitespace-nowrap">
              saída
            </span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
