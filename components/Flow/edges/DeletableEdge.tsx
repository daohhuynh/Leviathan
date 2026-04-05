'use client';

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
  type EdgeProps,
} from '@xyflow/react';
import { X } from 'lucide-react';
import { useSwarmStore } from '@/store/useSwarmStore';

export default function DeletableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) {
  const { deleteElements } = useReactFlow();
  const status = useSwarmStore((s) => s.status);
  const isIdle = status === 'IDLE';

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isIdle) return;
    deleteElements({ edges: [{ id }] });
  };

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          filter: 'drop-shadow(0 0 3px rgba(34, 211, 238, 0.3))',
        }}
      />
      {isIdle && (
        <EdgeLabelRenderer>
          <button
            onClick={handleDelete}
            className="nodrag nopan pointer-events-auto absolute flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-slate-900/90 opacity-0 transition-opacity hover:border-rose-500/50 hover:bg-rose-500/20 group-hover:opacity-100 [.react-flow__edge:hover+.react-flow__edgelabel_&]:opacity-100"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            title="Remove connection"
          >
            <X className="h-3 w-3 text-slate-400 hover:text-rose-400" />
          </button>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
