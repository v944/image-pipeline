import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { type PipelineNode, type PipelineEdge, type NodeType } from "../types";

interface PipelineState {
  nodes: PipelineNode[];
  edges: PipelineEdge[];
  selectedNodeId: string | null;

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
}

let nodeCounter = 0;
function generateNodeId(type: string): string {
  nodeCounter++;
  return `${type}-${nodeCounter}-${Date.now().toString(36)}`;
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

export const usePipelineStore = create<PipelineState>()(
  persist(
    (set, get) => ({
      nodes: [],
      edges: [],
      selectedNodeId: null,

      addNode: (type, position) => {
        const node = createNode(type, position);
        set((s) => ({ nodes: [...s.nodes, node] }));
      },

      removeNode: (id) => {
        set((s) => ({
          nodes: s.nodes.filter((n) => n.id !== id),
          edges: s.edges.filter((e) => e.source !== id && e.target !== id),
          selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
        }));
      },

      updateNodeData: (id, data) => {
        set((s) => ({
          nodes: s.nodes.map((n) =>
            n.id === id ? { ...n, data: { ...n.data, ...data } } : n
          ),
        }));
      },

      updateNodePosition: (id, position) => {
        set((s) => ({
          nodes: s.nodes.map((n) =>
            n.id === id ? { ...n, position } : n
          ),
        }));
      },

      setSelectedNode: (id) => set({ selectedNodeId: id }),

      addEdge: (source, target) => {
        const exists = get().edges.some(
          (e) => e.source === source && e.target === target
        );
        if (exists) return;
        const edge: PipelineEdge = {
          id: `edge-${source}-${target}`,
          source,
          target,
        };
        set((s) => ({ edges: [...s.edges, edge] }));
      },

      removeEdge: (id) => {
        set((s) => ({ edges: s.edges.filter((e) => e.id !== id) }));
      },

      resetPipeline: () => set({ nodes: [], edges: [], selectedNodeId: null }),

      loadPipeline: (nodes, edges) => set({ nodes, edges }),

      setNodes: (nodes) => set({ nodes }),
      setEdges: (edges) => set({ edges }),
    }),
    {
      name: "image-pipeline-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
      }),
    }
  )
);
