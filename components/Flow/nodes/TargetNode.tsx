'use client';

import { memo } from 'react';
import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react';
import { Crosshair, X } from 'lucide-react';
import { useSwarmStore } from '@/store/useSwarmStore';

function TargetNodeComponent({ id }: NodeProps) {
  const targetItem = useSwarmStore((s) => s.targetItem);
  const setTargetItem = useSwarmStore((s) => s.setTargetItem);
  const status = useSwarmStore((s) => s.status);
  const { deleteElements } = useReactFlow();
  const isIdle = status === 'IDLE';

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isIdle) return;
    deleteElements({ nodes: [{ id }] });
  };

  return (
    <div className="group relative min-w-[280px]">
      {/* Glow effect */}
      <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-violet-500/20 opacity-0 blur-sm transition-opacity duration-500 group-hover:opacity-100" />

      {/* Delete button */}
      {isIdle && (
        <button
          onClick={handleDelete}
          className="absolute -right-2 -top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-slate-900 opacity-0 shadow-lg transition-all hover:border-rose-500/50 hover:bg-rose-500/20 group-hover:opacity-100"
          title="Delete node"
        >
          <X className="h-3 w-3 text-slate-400 hover:text-rose-400" />
        </button>
      )}

      <div className="relative rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/50 backdrop-blur-md">
        {/* Header */}
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10">
            <Crosshair className="h-4 w-4 text-cyan-400" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
            Target
          </span>
        </div>

        {/* Input */}
        <input
          type="text"
          value={targetItem}
          onChange={(e) => setTargetItem(e.target.value)}
          disabled={!isIdle}
          placeholder="Enter procurement target..."
          className="nodrag w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 disabled:opacity-50"
        />

        {/* Subtitle */}
        <p className="mt-2 text-[10px] uppercase tracking-wider text-slate-500">
          Procurement Objective
        </p>
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !rounded-full !border-2 !border-cyan-400 !bg-slate-900"
      />
    </div>
  );
}

export const TargetNode = memo(TargetNodeComponent);
