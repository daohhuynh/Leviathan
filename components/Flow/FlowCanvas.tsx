'use client';

import { useCallback, useMemo, useRef, type DragEvent } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type NodeTypes,
  type EdgeTypes,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  type Connection,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion } from 'framer-motion';
import { Zap, RotateCcw } from 'lucide-react';
import { useSwarmStore } from '@/store/useSwarmStore';
import { TargetNode } from './nodes/TargetNode';
import { AgentNode } from './nodes/AgentNode';
import { OutputNode } from './nodes/OutputNode';
import DeletableEdge from './edges/DeletableEdge';



// ─────────────────────────────────────────────────
// Default graph layout
// ─────────────────────────────────────────────────
const initialNodes: Node[] = [
  {
    id: 'target-1',
    type: 'target',
    position: { x: 50, y: 180 },
    data: {},
  },
  {
    id: 'agent-1',
    type: 'agent',
    position: { x: 420, y: 80 },
    data: { label: 'Scout Alpha', role: 'Web Scraping & Vision Analysis' },
  },
  {
    id: 'agent-2',
    type: 'agent',
    position: { x: 420, y: 300 },
    data: { label: 'Negotiate Bot', role: 'Automated RFQ & Counter-offers' },
  },
  {
    id: 'output-1',
    type: 'output',
    position: { x: 780, y: 180 },
    data: {},
  },
];

const neonEdgeStyle = {
  stroke: '#22d3ee',
  strokeWidth: 2,
};

const initialEdges: Edge[] = [
  {
    id: 'e-target-agent1',
    source: 'target-1',
    target: 'agent-1',
    type: 'deletable',
    animated: true,
    style: neonEdgeStyle,
  },
  {
    id: 'e-target-agent2',
    source: 'target-1',
    target: 'agent-2',
    type: 'deletable',
    animated: true,
    style: neonEdgeStyle,
  },
  {
    id: 'e-agent1-output',
    source: 'agent-1',
    target: 'output-1',
    type: 'deletable',
    animated: true,
    style: neonEdgeStyle,
  },
  {
    id: 'e-agent2-output',
    source: 'agent-2',
    target: 'output-1',
    type: 'deletable',
    animated: true,
    style: neonEdgeStyle,
  },
];

// ─────────────────────────────────────────────────
// Default data for new nodes dropped from sidebar
// ─────────────────────────────────────────────────
const AGENT_ROLES = [
  { label: 'Scout Agent', role: 'Web Scraping & Data Extraction' },
  { label: 'Vision Agent', role: 'Product Image Classification' },
  { label: 'Risk Agent', role: 'Financial & Compliance Checks' },
  { label: 'Logistics Agent', role: 'Shipping & Customs Routing' },
  { label: 'Data Agent', role: 'Price Normalization & Analytics' },
];

let nodeIdCounter = 10;
function getNextId(type: string) {
  nodeIdCounter++;
  return `${type}-${nodeIdCounter}`;
}

// ─────────────────────────────────────────────────
// Inner component (needs ReactFlowProvider context)
// ─────────────────────────────────────────────────
function FlowCanvasInner() {
  const nodeTypes = useMemo<NodeTypes>(
    () => ({
      target: TargetNode,
      agent: AgentNode,
      output: OutputNode,
    }),
    []
  );

  const edgeTypes = useMemo<EdgeTypes>(
    () => ({
      deletable: DeletableEdge,
    }),
    []
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { status, triggerSwarm, resetSwarm, setIsDraggingNode } =
    useSwarmStore();
  const { screenToFlowPosition, deleteElements } = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const isIdle = status === 'IDLE';
  const isSuccess = status === 'SUCCESS';

  // ─── Connect handler ───
  const onConnect = useCallback(
    (params: Connection) => {
      if (!isIdle) return;
      setEdges((eds) =>
        addEdge(
          { ...params, type: 'deletable', animated: true, style: neonEdgeStyle },
          eds,
        ),
      );
    },
    [setEdges, isIdle],
  );

  // ─── Guarded change handlers (lock during swarm) ───
  const guardedNodesChange = useCallback(
    (changes: Parameters<typeof onNodesChange>[0]) => {
      // Allow position changes (dragging) always so nodes don't freeze mid-drag
      // Block remove changes when swarm is active
      if (!isIdle) {
        const safeChanges = changes.filter(
          (c) => c.type !== 'remove',
        );
        onNodesChange(safeChanges);
        return;
      }
      onNodesChange(changes);
    },
    [onNodesChange, isIdle],
  );

  const guardedEdgesChange = useCallback(
    (changes: Parameters<typeof onEdgesChange>[0]) => {
      if (!isIdle) {
        const safeChanges = changes.filter(
          (c) => c.type !== 'remove',
        );
        onEdgesChange(safeChanges);
        return;
      }
      onEdgesChange(changes);
    },
    [onEdgesChange, isIdle],
  );

  // ─── Drag from sidebar → canvas (drop handler) ───
  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (!isIdle) return;

      const nodeType = event.dataTransfer.getData('application/reactflow');
      if (!nodeType) return;

      // Convert screen position to flow position
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Build node data based on type
      let data: Record<string, unknown> = {};
      if (nodeType === 'agent') {
        const randomRole =
          AGENT_ROLES[Math.floor(Math.random() * AGENT_ROLES.length)];
        data = { label: randomRole.label, role: randomRole.role };
      }

      const newNode: Node = {
        id: getNextId(nodeType),
        type: nodeType,
        position,
        data,
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [isIdle, screenToFlowPosition, setNodes],
  );

  // ─── Drag node to sidebar trash zone ───
  const SIDEBAR_WIDTH = 224; // w-56 = 14rem = 224px

  const onNodeDragStart = useCallback(() => {
    setIsDraggingNode(true);
  }, [setIsDraggingNode]);

  const onNodeDragStop = useCallback(
    (event: React.MouseEvent | React.TouchEvent, node: Node) => {
      setIsDraggingNode(false);
      if (!isIdle) return;

      // Check if mouse is over the sidebar (trash zone)
      let clientX = 0;
      if ('clientX' in event) {
        clientX = event.clientX;
      } else if ('changedTouches' in event && event.changedTouches.length > 0) {
        clientX = event.changedTouches[0].clientX;
      }

      if (clientX > 0 && clientX < SIDEBAR_WIDTH) {
        // Get the node that was being dragged
        const selectedNodes = nodes.filter((n) => n.id === node.id || n.selected);
        if (selectedNodes.length > 0) {
          deleteElements({
            nodes: selectedNodes.map((n) => ({ id: n.id })),
          });
        }
      }
    },
    [isIdle, nodes, deleteElements, setIsDraggingNode],
  );

  // ─── Status color ───
  const statusColor = useMemo(() => {
    switch (status) {
      case 'DEPLOYING':
        return 'from-amber-500 to-orange-500';
      case 'SCRAPING':
        return 'from-cyan-500 to-blue-500';
      case 'NEGOTIATING':
        return 'from-violet-500 to-purple-500';
      case 'SUCCESS':
        return 'from-emerald-500 to-green-500';
      default:
        return 'from-cyan-500 to-violet-500';
    }
  }, [status]);

  return (
    <div ref={reactFlowWrapper} className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={guardedNodesChange}
        onEdgesChange={guardedEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        deleteKeyCode={isIdle ? ['Backspace', 'Delete'] : []}
        fitView
        proOptions={{ hideAttribution: true }}
        className="bg-transparent"
        snapToGrid
        snapGrid={[15, 15]}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="rgba(148, 163, 184, 0.08)"
        />
        <Controls
          className="!rounded-xl !border !border-white/10 !bg-slate-900/80 !shadow-xl !backdrop-blur-sm [&>button]:!border-white/5 [&>button]:!bg-transparent [&>button]:!text-slate-400 [&>button:hover]:!bg-white/5 [&>button:hover]:!text-white [&>button>svg]:!fill-current"
        />
        <MiniMap
          className="!rounded-xl !border !border-white/10 !bg-slate-900/80 !shadow-xl !backdrop-blur-sm"
          nodeColor={() => '#22d3ee'}
          maskColor="rgba(0, 0, 0, 0.7)"
        />
      </ReactFlow>

      {/* ─── Deploy / Reset Button ─── */}
      <div className="absolute right-6 top-6 z-50">
        {isSuccess ? (
          <motion.button
            onClick={resetSwarm}
            className="group flex items-center gap-2 rounded-xl border border-white/10 bg-slate-800/80 px-5 py-3 text-sm font-semibold text-white shadow-2xl backdrop-blur-sm transition-all hover:border-white/20 hover:bg-slate-700/80"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RotateCcw className="h-4 w-4 text-slate-400 transition-transform group-hover:rotate-[-90deg]" />
            Reset Swarm
          </motion.button>
        ) : (
          <motion.button
            onClick={triggerSwarm}
            disabled={!isIdle}
            className="group relative overflow-hidden rounded-xl px-6 py-3 text-sm font-bold text-white shadow-2xl shadow-cyan-500/20 transition-all disabled:cursor-not-allowed disabled:opacity-50"
            whileHover={isIdle ? { scale: 1.05 } : {}}
            whileTap={isIdle ? { scale: 0.95 } : {}}
          >
            {/* Button gradient bg */}
            <div
              className={`absolute inset-0 bg-gradient-to-r ${statusColor} transition-all duration-700`}
            />
            {/* Shimmer */}
            {!isIdle && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
            <span className="relative flex items-center gap-2">
              <Zap className="h-4 w-4" />
              {isIdle
                ? 'Deploy Swarm'
                : status === 'DEPLOYING'
                  ? 'Deploying...'
                  : status === 'SCRAPING'
                    ? 'Scraping...'
                    : 'Negotiating...'}
            </span>
          </motion.button>
        )}
      </div>

      {/* ─── Status Badge ─── */}
      {!isIdle && (
        <motion.div
          className="absolute left-6 top-6 z-50 flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/80 px-4 py-2 backdrop-blur-sm"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <motion.div
            className={`h-2 w-2 rounded-full bg-gradient-to-r ${statusColor}`}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-slate-300">
            {status}
          </span>
        </motion.div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────
// Wrapper with ReactFlowProvider
// ─────────────────────────────────────────────────
export default function FlowCanvas() {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner />
    </ReactFlowProvider>
  );
}
