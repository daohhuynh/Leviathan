'use client';

import { memo } from 'react';
import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react';
import { FileText, X, Eye, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSwarmStore } from '@/store/useSwarmStore';

function OutputNodeComponent({ id }: NodeProps) {
  const status = useSwarmStore((s) => s.status);
  const setShowDocumentModal = useSwarmStore((s) => s.setShowDocumentModal);
  const setShowEmailModal = useSwarmStore((s) => s.setShowEmailModal);
  const emailSent = useSwarmStore((s) => s.emailSent);
  const { deleteElements } = useReactFlow();
  const isSuccess = status === 'SUCCESS';
  const isIdle = status === 'IDLE';

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isIdle) return;
    deleteElements({ nodes: [{ id }] });
  };

  return (
    <div className="group relative min-w-[260px]">
      {/* Success glow */}
      {isSuccess && (
        <motion.div
          className="absolute -inset-1 rounded-2xl bg-violet-500/30 blur-md"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
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
        <div className="mb-3 flex items-center gap-2">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-lg ${
              isSuccess ? 'bg-violet-500/20' : 'bg-violet-500/10'
            }`}
          >
            <FileText
              className={`h-4 w-4 ${
                isSuccess ? 'text-violet-300' : 'text-violet-400'
              }`}
            />
          </div>
          <span className="text-xs font-semibold uppercase tracking-widest text-violet-400">
            Output
          </span>
        </div>

        {/* Label */}
        <h3 className="text-sm font-medium text-white">Generate LOI</h3>
        <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">
          Letter of Intent & Contract
        </p>

        {/* Success state — actionable buttons */}
        {isSuccess && (
          <motion.div
            className="mt-3 space-y-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {/* Review Document button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDocumentModal(true);
              }}
              className="nodrag flex w-full items-center gap-2 rounded-lg border border-violet-500/20 bg-violet-500/10 px-3 py-2 transition-all hover:border-violet-400/40 hover:bg-violet-500/20"
            >
              <Eye className="h-3.5 w-3.5 text-violet-300" />
              <span className="text-[11px] font-medium text-violet-300">
                Review Document
              </span>
            </button>

            {/* Send Email button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowEmailModal(true);
              }}
              className="nodrag flex w-full items-center gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 transition-all hover:border-cyan-400/40 hover:bg-cyan-500/20"
            >
              <Mail className="h-3.5 w-3.5 text-cyan-300" />
              <span className="text-[11px] font-medium text-cyan-300">
                {emailSent ? '✓ Email Sent' : 'Send via Email'}
              </span>
            </button>
          </motion.div>
        )}
      </div>

      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !rounded-full !border-2 !border-violet-400 !bg-slate-900"
      />
    </div>
  );
}

export const OutputNode = memo(OutputNodeComponent);
