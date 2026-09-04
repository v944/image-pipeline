import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { type PipelineNode, type PipelineEdge, type NodeType, VALID_NODE_TYPES } from "../types";
import { sanitizeData } from "../lib/sanitize";

interface Snapshot {
  nodes: PipelineNode[];
  edges: PipelineEdge[];
  selectedNodeId: string | null;
}

interface PipelineState {
  nodes: PipelineNode[];
  edges: PipelineEdge[];
  selectedNodeId: string | null;
  past: Snapshot[];
  future: Snapshot[];

  addNode: (type: NodeType, position: { x: number; y: number }) => void;
  removeNode: (id: string) => void;
  updateNodeData: (id: string, data: Record<string, unknown>) => void;
  updateNodePosition: (id: string, position: { x: number; y: number }) => void;
  setSelectedNode: (id: string | null) => void;
  addEdge: (source: string, target: string) => void;
  removeEdge: (id: string) => void;
  resetPipeline: () => void;
  loadPipeline: (nodes: PipelineNode[], edges: PipelineEdge[]) => void;
  setNodes: (nodes: PipelineNode[]) => void;
  setEdges: (edges: PipelineEdge[]) => void;
  undo: () => void;
  redo: () => void;
}

let nodeCounter = 0;
function generateNodeId(type: string): string {
  nodeCounter++;
  return `${type}-${nodeCounter}-${Date.now().toString(36)}`;
}

function sanitizeLoadedNodes(nodes: PipelineNode[] | undefined): PipelineNode[] {
  if (!Array.isArray(nodes)) return [];
  const valid = new Set<string>(VALID_NODE_TYPES);
  return nodes.filter((n) => n && valid.has(n.type));
}

function sanitizeLoadedEdges(
  edges: PipelineEdge[] | undefined,
  nodeIds: Set<string>
): PipelineEdge[] {
  if (!Array.isArray(edges)) return [];
  return edges.filter(
    (e) => e && nodeIds.has(e.source) && nodeIds.has(e.target)
  );
}

function getDefaultNodeData(type: NodeType): Record<string, unknown> {
  switch (type) {
    case "resize":
      return { width: 1920, height: null, mode: "fit", keepAspectRatio: true, algorithm: "auto" };
    case "crop":
      return { x: 0, y: 0, width: 1080, height: 1080, unit: "px" };
    case "compress":
      return { quality: 85, method: "lossy" };
    case "watermark":
      return { text: "", position: "bottom-right", opacity: 0.5, fontSize: 24 };
    case "format":
      return { targetFormat: "WebP", keepOriginal: false };
    case "rename":
      return { pattern: "{original}_{index}", extension: "keep" };
    case "export":
      return { format: "PNG", quality: 85, preserveMetadata: false };
    case "denoise":
      return { method: "median", strength: 2, radius: 3 };
    case "emotion":
      return { emotion: "neutral", intensity: 80, preview: true };
    case "hsl":
      return { hue: 0, saturation: 0, lightness: 0 };
    case "brightness":
      return { value: 0 };
    case "contrast":
      return { value: 0 };
    case "exposure":
      return { value: 0 };
    case "blur":
      return { value: 0 };
    case "sharpen":
      return { value: 0 };
    case "temperature":
      return { value: 0 };
    case "grayscale":
      return { value: 0 };
    case "rotate":
      return { rotation: "none", flip: "none" };
    case "load":
      return { fileId: null, includeSubfolders: false };
    default:
      return {};
  }
}

function createNode(type: NodeType, position: { x: number; y: number }): PipelineNode {
  return {
    id: generateNodeId(type),
    type,
    position,
    data: getDefaultNodeData(type),
    label: null,
    enabled: true,
  };
}

let lastSnapshotTime = 0;
const MIN_SNAPSHOT_INTERVAL = 300;

function snapshot(get: () => PipelineState): { past: Snapshot[]; future: [] } {
  const now = Date.now();
  if (now - lastSnapshotTime < MIN_SNAPSHOT_INTERVAL) {
    return { past: get().past, future: [] };
  }
  lastSnapshotTime = now;
  const { nodes, edges, selectedNodeId, past } = get();
  return {
    past: [...past, { nodes: structuredClone(nodes), edges: structuredClone(edges), selectedNodeId }],
    future: [],
  };
}

export const usePipelineStore = create<PipelineState>()(
  persist(
    (set, get) => ({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      past: [],
      future: [],

      addNode: (type, position) => {
        const s = snapshot(get);
        const node = createNode(type, position);
        set({ ...s, nodes: [...get().nodes, node] });
      },

      removeNode: (id) => {
        const s = snapshot(get);
        set((cur) => ({
          ...s,
          nodes: cur.nodes.filter((n) => n.id !== id),
          edges: cur.edges.filter((e) => e.source !== id && e.target !== id),
          selectedNodeId: cur.selectedNodeId === id ? null : cur.selectedNodeId,
        }));
      },

      updateNodeData: (id, data) => {
        const s = snapshot(get);
        const clean = sanitizeData(data);
        set((cur) => ({
          ...s,
          nodes: cur.nodes.map((n) =>
            n.id === id ? { ...n, data: { ...n.data, ...clean } } : n
          ),
        }));
      },

      updateNodePosition: (id, position) => {
        set((cur) => ({
          nodes: cur.nodes.map((n) =>
            n.id === id ? { ...n, position } : n
          ),
        }));
      },

      setSelectedNode: (id) => set({ selectedNodeId: id }),

      addEdge: (source, target) => {
        if (get().edges.some((e) => e.source === source && e.target === target)) return;
        const s = snapshot(get);
        const edge: PipelineEdge = { id: `edge-${source}-${target}`, source, target };
        set({ ...s, edges: [...get().edges, edge] });
      },

      removeEdge: (id) => {
        const s = snapshot(get);
        set((cur) => ({ ...s, edges: cur.edges.filter((e) => e.id !== id) }));
      },

      resetPipeline: () => {
        const s = snapshot(get);
        set({ ...s, nodes: [], edges: [], selectedNodeId: null });
      },

      loadPipeline: (nodes, edges) => {
        const s = snapshot(get);
        const cleanNodes = sanitizeLoadedNodes(nodes);
        const ids = new Set(cleanNodes.map((n) => n.id));
        const cleanEdges = sanitizeLoadedEdges(edges, ids);
        set({ ...s, nodes: structuredClone(cleanNodes), edges: structuredClone(cleanEdges) });
      },

      setNodes: (nodes) => {
        const s = snapshot(get);
        set({ ...s, nodes });
      },

      setEdges: (edges) => {
        const s = snapshot(get);
        set({ ...s, edges });
      },

      undo: () => {
        const { past, nodes, edges, selectedNodeId } = get();
        if (past.length === 0) return;
        const prev = past[past.length - 1];
        set({
          past: past.slice(0, -1),
          future: [{ nodes: structuredClone(nodes), edges: structuredClone(edges), selectedNodeId }, ...get().future],
          nodes: prev.nodes,
          edges: prev.edges,
          selectedNodeId: prev.selectedNodeId,
        });
      },

      redo: () => {
        const { future, nodes, edges, selectedNodeId } = get();
        if (future.length === 0) return;
        const next = future[0];
        set({
          future: future.slice(1),
          past: [...get().past, { nodes: structuredClone(nodes), edges: structuredClone(edges), selectedNodeId }],
          nodes: next.nodes,
          edges: next.edges,
          selectedNodeId: next.selectedNodeId,
        });
      },
    }),
    {
      name: "image-pipeline-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const nodes = sanitizeLoadedNodes(state.nodes);
        const ids = new Set(nodes.map((n) => n.id));
        const edges = sanitizeLoadedEdges(state.edges, ids);
        const changed =
          nodes.length !== (state.nodes?.length ?? 0) ||
          edges.length !== (state.edges?.length ?? 0);
        if (changed) {
          usePipelineStore.setState({
            nodes,
            edges,
            selectedNodeId:
              state.selectedNodeId && ids.has(state.selectedNodeId)
                ? state.selectedNodeId
                : null,
          });
        }
      },
    }
  )
);
