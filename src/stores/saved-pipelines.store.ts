import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { SavedPipeline, PipelineNode, PipelineEdge } from "../types";

interface SavedPipelinesState {
  pipelines: SavedPipeline[];
  save: (name: string, description: string | null, nodes: PipelineNode[], edges: PipelineEdge[]) => void;
  remove: (id: string) => void;
  rename: (id: string, name: string) => void;
}

function generateId(): string {
  return Date.now().toString(36) + "-" + crypto.randomUUID().slice(0, 8);
}

export const useSavedPipelinesStore = create<SavedPipelinesState>()(
  persist(
    (set) => ({
      pipelines: [],

      save: (name, description, nodes, edges) => {
        const now = new Date().toISOString();
        const entry: SavedPipeline = {
          id: generateId(),
          name,
          description,
          version: "1.0",
          createdAt: now,
          updatedAt: now,
          nodes: structuredClone(nodes),
          edges: structuredClone(edges),
          tags: [],
        };
        set((s) => ({ pipelines: [...s.pipelines, entry] }));
      },

      remove: (id) => {
        set((s) => ({ pipelines: s.pipelines.filter((p) => p.id !== id) }));
      },

      rename: (id, name) => {
        set((s) => ({
          pipelines: s.pipelines.map((p) =>
            p.id === id ? { ...p, name, updatedAt: new Date().toISOString() } : p
          ),
        }));
      },
    }),
    {
      name: "image-pipeline-saved",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
