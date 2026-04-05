'use client';

import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import LiveTerminal from '@/components/Terminal/LiveTerminal';
import DocumentModal from '@/components/DocumentModal';
import EmailModal from '@/components/EmailModal';

// Dynamically import FlowCanvas to avoid SSR issues with React Flow
const FlowCanvas = dynamic(() => import('@/components/Flow/FlowCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400/20 border-t-cyan-400" />
        <span className="font-mono text-xs uppercase tracking-widest text-slate-600">
          Loading Canvas...
        </span>
      </div>
    </div>
  ),
});

export default function Home() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-950">
      {/* Top Bar */}
      <Header />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Right side: Canvas + Terminal split */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Canvas — takes 75% */}
          <div className="relative flex-[3] overflow-hidden">
            <FlowCanvas />
          </div>

          {/* Terminal — takes 25% */}
          <div className="flex-1 overflow-hidden">
            <LiveTerminal />
          </div>
        </div>
      </div>

      {/* Modals (portaled above everything) */}
      <DocumentModal />
      <EmailModal />
    </div>
  );
}
