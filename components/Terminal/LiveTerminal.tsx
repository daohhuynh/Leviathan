'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, ChevronRight } from 'lucide-react';
import { useSwarmStore } from '@/store/useSwarmStore';

const typeColorMap: Record<string, string> = {
  info: 'text-slate-400',
  success: 'text-emerald-400',
  error: 'text-rose-400',
  warning: 'text-amber-400',
};

export default function LiveTerminal() {
  const logs = useSwarmStore((s) => s.logs);
  const status = useSwarmStore((s) => s.status);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex h-full flex-col border-t border-cyan-900/30 bg-black">
      {/* Terminal Header */}
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-2">
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-cyan-500" />
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-slate-500">
            Swarm Terminal
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-wider text-slate-600">
            {logs.length} events
          </span>
          {status !== 'IDLE' && status !== 'SUCCESS' && (
            <motion.div
              className="h-1.5 w-1.5 rounded-full bg-emerald-500"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </div>
      </div>

      {/* Log Stream */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-800"
      >
        {logs.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="font-mono text-xs text-slate-700">
              Awaiting swarm deployment...
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {logs.map((log) => (
              <motion.div
                key={log.id}
                className="mb-1 flex items-start gap-2 font-mono text-sm leading-relaxed"
                initial={{ opacity: 0, y: 10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                {/* Timestamp */}
                <span className="shrink-0 text-slate-600">
                  {log.timestamp}
                </span>

                {/* Chevron */}
                <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-slate-700" />

                {/* Agent tag */}
                <span className="shrink-0 text-cyan-400">
                  [{log.agent}]
                </span>

                {/* Message */}
                <span className={typeColorMap[log.type] ?? 'text-slate-400'}>
                  {log.message}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
