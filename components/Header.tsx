'use client';

import { motion } from 'framer-motion';
import { Activity, Waves, Signal } from 'lucide-react';
import { useSwarmStore } from '@/store/useSwarmStore';

export default function Header() {
  const status = useSwarmStore((s) => s.status);

  return (
    <header className="relative z-50 flex h-14 shrink-0 items-center justify-between border-b border-white/5 bg-slate-950/80 px-6 backdrop-blur-sm">
      {/* Left — Logo */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Waves className="h-6 w-6 text-cyan-400" />
          {status !== 'IDLE' && (
            <motion.div
              className="absolute -inset-1 rounded-full bg-cyan-400/20 blur-sm"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </div>
        <div className="flex items-baseline gap-2">
          <h1 className="text-lg font-bold tracking-wider text-white">
            LEVIATHAN
          </h1>
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-600">
            Swarm v4.2
          </span>
        </div>
      </div>

      {/* Center — Status Indicators */}
      <div className="hidden items-center gap-6 md:flex">
        <StatusIndicator
          icon={<Signal className="h-3 w-3" />}
          label="Network"
          active={status !== 'IDLE'}
        />
        <StatusIndicator
          icon={<Activity className="h-3 w-3" />}
          label="Agents"
          active={status === 'SCRAPING' || status === 'NEGOTIATING'}
        />
      </div>

      {/* Right — Version */}
      <div className="flex items-center gap-3">
        <div className="hidden h-7 items-center rounded-full border border-white/10 bg-white/5 px-3 sm:flex">
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
            {status}
          </span>
        </div>
      </div>
    </header>
  );
}

function StatusIndicator({
  icon,
  label,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`${active ? 'text-emerald-400' : 'text-slate-600'} transition-colors duration-500`}
      >
        {icon}
      </div>
      <span
        className={`font-mono text-[10px] uppercase tracking-widest ${
          active ? 'text-emerald-400' : 'text-slate-600'
        } transition-colors duration-500`}
      >
        {label}
      </span>
      <div
        className={`h-1.5 w-1.5 rounded-full ${
          active ? 'bg-emerald-400' : 'bg-slate-700'
        } transition-colors duration-500`}
      />
    </div>
  );
}
