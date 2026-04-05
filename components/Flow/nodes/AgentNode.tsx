'use client';

import { memo } from 'react';
import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react';
import { Bot, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSwarmStore } from '@/store/useSwarmStore';

interface AgentNodeData {
  label?: string;
  role?: string;
  [key: string]: unknown;
}

function AgentNodeComponent({ id, data }: NodeProps) {
  const status = useSwarmStore((s) => s.status);
  const { deleteElements } = useReactFlow();
  const isActive = status !== 'IDLE';
  const isIdle = status === 'IDLE';
  const nodeData = data as AgentNodeData;
  const label = nodeData?.label ?? 'Scout Agent';
  const role = nodeData?.role ?? 'Web Scraping & Data Extraction';

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isIdle) return;
    deleteElements({ nodes: [{ id }] });
  };

  return (
    <div className="group relative min-w-[240px]">
      {/* Active glow */}
      {isActive && (
        <motion.div
          className="absolute -inset-1 rounded-2xl bg-emerald-500/20 blur-md"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

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
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10">
              <Bot className="h-4 w-4 text-emerald-400" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
              Agent
            </span>
          </div>

          {/* Pulse indicator */}
          <div className="relative flex h-3 w-3 items-center justify-center">
            {isActive && (
              <motion.span
                className="absolute inline-flex h-full w-full rounded-full bg-emerald-400"
                animate={{ scale: [1, 1.8, 1], opacity: [0.7, 0, 0.7] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
            <span
              className={`relative inline-flex h-2 w-2 rounded-full ${
                isActive ? 'bg-emerald-400' : 'bg-slate-600'
              }`}
            />
          </div>
        </div>

        {/* Agent name */}
        <h3 className="text-sm font-medium text-white">{label}</h3>
        <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">
          {role}
        </p>

        {/* Status bar */}
        {isActive && (
          <motion.div
            className="mt-3 h-1 overflow-hidden rounded-full bg-slate-800"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
        )}
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !rounded-full !border-2 !border-emerald-400 !bg-slate-900"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !rounded-full !border-2 !border-emerald-400 !bg-slate-900"
      />
    </div>
  );
}

export const AgentNode = memo(AgentNodeComponent);
