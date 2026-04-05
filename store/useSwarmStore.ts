import { create } from 'zustand';

export type SwarmStatus =
  | 'IDLE'
  | 'DEPLOYING'
  | 'SCRAPING'
  | 'NEGOTIATING'
  | 'SUCCESS';

export type LogType = 'info' | 'error' | 'success' | 'warning';

export interface SwarmLog {
  id: string;
  timestamp: string;
  agent: string;
  message: string;
  type: LogType;
}

interface SwarmState {
  // Core state
  status: SwarmStatus;
  logs: SwarmLog[];
  targetItem: string;

  // UI state
  showDocumentModal: boolean;
  showEmailModal: boolean;
  isDraggingNode: boolean;
  generatedLOI: string | null;
  emailSent: boolean;

  // Actions
  setTargetItem: (item: string) => void;
  addLog: (log: Omit<SwarmLog, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
  triggerSwarm: () => void;
  resetSwarm: () => void;
  setShowDocumentModal: (show: boolean) => void;
  setShowEmailModal: (show: boolean) => void;
  setIsDraggingNode: (dragging: boolean) => void;
  setEmailSent: (sent: boolean) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);
const now = () => new Date().toISOString().split('T')[1].split('.')[0];


// ─────────────────────────────────────────────────────────────
// SCRIPT: Swarm Store
// ─────────────────────────────────────────────────────────────
export const useSwarmStore = create<SwarmState>((set, get) => ({
  status: 'IDLE',
  logs: [],
  targetItem: '5000 Custom Solar Inverters',

  // UI state
  showDocumentModal: false,
  showEmailModal: false,
  isDraggingNode: false,
  generatedLOI: null,
  emailSent: false,

  setTargetItem: (item: string) => set({ targetItem: item }),

  addLog: (log) =>
    set((state) => ({
      logs: [
        ...state.logs,
        { ...log, id: generateId(), timestamp: now() },
      ],
    })),

  clearLogs: () => set({ logs: [] }),

  resetSwarm: () =>
    set({ status: 'IDLE', logs: [], generatedLOI: null, emailSent: false }),

  setShowDocumentModal: (show) => set({ showDocumentModal: show }),
  setShowEmailModal: (show) => set({ showEmailModal: show }),
  setIsDraggingNode: (dragging) => set({ isDraggingNode: dragging }),
  setEmailSent: (sent) => set({ emailSent: sent }),

  triggerSwarm: async () => {
    const { status, addLog, targetItem } = get();
    if (status !== 'IDLE') return;

    set({ logs: [], status: 'DEPLOYING', generatedLOI: null, emailSent: false });

    // Initial logs
    addLog({ agent: 'SWARM_CTRL', message: 'Initializing Leviathan swarm protocol v4.2.1...', type: 'info' });
    addLog({ agent: 'SWARM_CTRL', message: 'Connecting to Leviathan Cloud Agent...', type: 'info' });

    // Open Server-Sent Events stream to pipe Python terminal logs directly to UI
    const eventSource = new EventSource('http://localhost:8000/stream-logs');
    
    eventSource.onmessage = (event) => {
      const msg = event.data;
      
      // Determine logical UI type/agent based on string content
      let logType: LogType = 'info';
      let agent = 'CLOUD_AGENT';
      
      const lowerMsg = msg.toLowerCase();
      if (lowerMsg.includes('error') || lowerMsg.includes('failed') || lowerMsg.includes('timeout')) {
        logType = 'error';
      } else if (lowerMsg.includes('success') || lowerMsg.includes('found')) {
        logType = 'success';
      } else if (lowerMsg.includes('warning')) {
        logType = 'warning';
      }
      
      // Attempt to parse out module names from standard Python brackets e.g. INFO: [browser_use] ...
      if (msg.includes('[') && msg.includes(']')) {
        const potentialTag = msg.split('[')[1].split(']')[0];
        if (potentialTag.length < 15) {
          agent = potentialTag.toUpperCase();
        }
      }

      get().addLog({ agent, message: msg, type: logType });
      
      // Dynamically push the Swarm UI status forward to look active
      if (lowerMsg.includes('search') || lowerMsg.includes('navigating')) {
        set({ status: 'SCRAPING' });
      } else if (lowerMsg.includes('price') || lowerMsg.includes('negotiat') || lowerMsg.includes('click')) {
        set({ status: 'NEGOTIATING' });
      }
    };

    eventSource.onerror = () => {
      // Typically just means the stream closed naturally or backend reloaded, no need to spam logs
      console.log("[EventSource] Connection closed or errored.");
    };

    try {
      // Dispatch the real backend call
      const res = await fetch('http://localhost:8000/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ target_item: targetItem, strategy: 'balanced' }),
      });
      
      const data = await res.json();
      
      // Stop the SSE Stream
      eventSource.close();
      
      if (!res.ok) {
        get().addLog({ agent: 'SYSTEM', message: `Cloud execution failed: ${data.detail || 'Unknown error'}`, type: 'error' });
        set({ status: 'IDLE' });
        return;
      }

      // Success Phase - Snap UI and inject actual backend results
      set({ status: 'SUCCESS' });
      get().addLog({ agent: 'CLOUD_AGENT', message: '✦ CLOUD BROWSER TASK COMPLETE ✦', type: 'success' });
      get().addLog({ agent: 'CLOUD_AGENT', message: data.message, type: 'success' });
      
      // Inject the dynamic LLM LOI straight from the backend payload
      set({ generatedLOI: data.loi || 'Document failed to generate.' });

    } catch (err) {
      eventSource.close();
      get().addLog({ agent: 'SYSTEM', message: `Failed to connect to backend: ${err}`, type: 'error' });
      set({ status: 'IDLE' });
    }
  },
}));
