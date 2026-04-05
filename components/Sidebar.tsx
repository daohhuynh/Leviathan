'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Crosshair,
  Bot,
  FileText,
  GripVertical,
  Trash2,
} from 'lucide-react';
import { useSwarmStore } from '@/store/useSwarmStore';

const paletteItems = [
  {
    type: 'target',
    label: 'Target',
    description: 'Procurement objective',
    icon: Crosshair,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
  },
  {
    type: 'agent',
    label: 'Agent',
    description: 'Swarm bot instance',
    icon: Bot,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
  },
  {
    type: 'output',
    label: 'Output',
    description: 'Document generation',
    icon: FileText,
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
  },
];

export default function Sidebar() {
  const isDraggingNode = useSwarmStore((s) => s.isDraggingNode);
  const status = useSwarmStore((s) => s.status);
  const isIdle = status === 'IDLE';

  const onDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    nodeType: string,
  ) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="relative flex w-56 shrink-0 flex-col border-r border-white/5 bg-slate-950/50 backdrop-blur-sm">
      {/* Sidebar header */}
      <div className="border-b border-white/5 px-4 py-3">
        <h2 className="font-mono text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Node Palette
        </h2>
      </div>

      {/* Palette items */}
      <div className="flex-1 space-y-2 p-3">
        {paletteItems.map((item, i) => (
          <motion.div
            key={item.type}
            draggable={isIdle}
            onDragStart={(e) =>
              onDragStart(
                e as unknown as React.DragEvent<HTMLDivElement>,
                item.type,
              )
            }
            className={`group flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 transition-all hover:border-white/10 hover:bg-white/[0.04] ${
              isIdle
                ? 'cursor-grab active:cursor-grabbing'
                : 'cursor-not-allowed opacity-50'
            }`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.bgColor}`}
            >
              <item.icon className={`h-4 w-4 ${item.color}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-white">{item.label}</p>
              <p className="truncate text-[10px] text-slate-600">
                {item.description}
              </p>
            </div>
            <GripVertical className="h-3 w-3 text-slate-700 opacity-0 transition-opacity group-hover:opacity-100" />
          </motion.div>
        ))}
      </div>

      {/* ─── Trash Zone ─── */}
      {/* Always visible at bottom, but lights up red when dragging a node from canvas */}
      <AnimatePresence>
        {isDraggingNode && isIdle ? (
          <motion.div
            className="mx-3 mb-3 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-rose-500/40 bg-rose-500/10 py-6"
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Trash2 className="h-5 w-5 text-rose-400" />
            <p className="font-mono text-[10px] uppercase tracking-widest text-rose-400">
              Drop to delete
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Footer */}
      <div className="border-t border-white/5 px-4 py-3">
        <p className="font-mono text-[9px] uppercase tracking-wider text-slate-700">
          {isIdle ? 'Drag to canvas • Drag back to delete' : 'Locked during swarm'}
        </p>
      </div>
    </aside>
  );
}
