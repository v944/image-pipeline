export type NodeType =
  | "load"
  | "resize"
  | "crop"
  | "compress"
  | "format"
  | "watermark"
  | "rename"
  | "denoise"
  | "export";

export interface PipelineNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: Record<string, unknown>;
  label: string | null;
  enabled: boolean;
}

export interface PipelineEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface Pipeline {
  version: string;
  name: string;
  nodes: PipelineNode[];
  edges: PipelineEdge[];
}

export interface SavedPipeline {
  id: string;
  name: string;
  description: string | null;
  version: "1.0";
  createdAt: string;
  updatedAt: string;
  nodes: PipelineNode[];
  edges: PipelineEdge[];
  tags: string[];
}

export type PlanTier = "free" | "pro" | "lifetime";

export interface LimitConfig {
  files: number;
  nodes: number;
  batches: number;
  formats: number;
}

export const FREE_LIMITS: LimitConfig = {
  files: 10,
  nodes: 4,
  batches: 10,
  formats: 2,
};

export const PRO_LIMITS: LimitConfig = {
  files: Infinity,
  nodes: Infinity,
  batches: Infinity,
  formats: Infinity,
};
