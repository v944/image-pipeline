import { applyResize, applyCrop, applyWatermark, applyDenoise, applyEmotionFilter, applySaturation } from "../../core/canvas";
import type { PipelineNode, PipelineEdge } from "../../types";

function findUpstreamNodeIds(
  nodeId: string,
  nodes: PipelineNode[],
  edges: PipelineEdge[],
  visited = new Set<string>()
): string[] {
  if (visited.has(nodeId)) return [];
  visited.add(nodeId);
  const result: string[] = [];
  const incoming = edges.filter((e) => e.target === nodeId);
  for (const edge of incoming) {
    const src = nodes.find((n) => n.id === edge.source);
    if (!src) continue;
    result.push(src.id, ...findUpstreamNodeIds(src.id, nodes, edges, visited));
  }
  return result;
}

function topologicalSort(nodeIds: string[], edges: PipelineEdge[]): string[] {
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  nodeIds.forEach((id) => {
    inDegree.set(id, 0);
    adj.set(id, []);
  });

  edges.forEach((e) => {
    if (nodeIds.includes(e.source) && nodeIds.includes(e.target)) {
      adj.get(e.source)?.push(e.target);
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    }
  });

  const queue: string[] = [];
  inDegree.forEach((deg, id) => { if (deg === 0) queue.push(id); });

  const sorted: string[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    sorted.push(id);
    for (const neighbor of adj.get(id) || []) {
      const newDeg = (inDegree.get(neighbor) || 1) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) queue.push(neighbor);
    }
  }
  return sorted;
}

async function applyProcessing(
  canvas: HTMLCanvasElement,
  node: PipelineNode
): Promise<HTMLCanvasElement> {
  switch (node.type) {
    case "resize":
      return applyResize(canvas, node.data as any);
    case "crop":
      return applyCrop(canvas, node.data as any);
    case "watermark":
      return applyWatermark(canvas, node.data as any);
    case "denoise":
      return applyDenoise(canvas, node.data as any);
    case "emotion":
      return applyEmotionFilter(canvas, node.data as any);
    case "saturation":
      return applySaturation(canvas, node.data as any);
    default:
      return canvas;
  }
}

export async function processUpstreamChain(
  source: HTMLCanvasElement,
  nodes: PipelineNode[],
  edges: PipelineEdge[],
  currentNodeId: string
): Promise<HTMLCanvasElement> {
  const upstreamIds = findUpstreamNodeIds(currentNodeId, nodes, edges);
  if (upstreamIds.length === 0) return source;

  const upstreamNodes = nodes.filter((n) => upstreamIds.includes(n.id) && n.enabled !== false);
  const sortedIds = topologicalSort(upstreamNodes.map((n) => n.id), edges);
  const nodeMap = new Map(upstreamNodes.map((n) => [n.id, n]));

  let current = source;
  for (const id of sortedIds) {
    const node = nodeMap.get(id);
    if (!node || node.type === "load") continue;
    current = await applyProcessing(current, node);
  }
  return current;
}
