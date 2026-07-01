import { applyResize, applyCrop, applyWatermark, applyDenoise, convertFormat } from "./canvas";
import type { PipelineNode, PipelineEdge } from "../types";

export interface ProcessingResult {
  nodeId: string;
  canvas: HTMLCanvasElement;
  blob?: Blob;
}

export class PipelineEngine {
  async execute(
    source: HTMLCanvasElement,
    nodes: PipelineNode[],
    edges: PipelineEdge[]
  ): Promise<Blob> {
    const chain = this.findActiveChain(nodes, edges);
    if (chain.length === 0) return convertFormat(source, "PNG", 85);

    const sorted = this.topologicalSortNodes(chain, edges);
    let currentCanvas = source;

    for (const node of sorted) {
      if (!node.enabled || node.type === "load") continue;
      currentCanvas = await this.processNode(node, currentCanvas);
    }

    const exportNode = sorted.find((n) => n.type === "export");
    const format = (exportNode?.data?.format as string) || "PNG";
    const quality = (exportNode?.data?.quality as number) || 85;

    return convertFormat(currentCanvas, format, quality);
  }

  private findActiveChain(
    nodes: PipelineNode[],
    edges: PipelineEdge[]
  ): PipelineNode[] {
    const loadNodes = nodes.filter(
      (n) => n.type === "load" && n.data?.fileId
    );
    if (loadNodes.length === 0) return [];

    const adj = new Map<string, string[]>();
    nodes.forEach((n) => adj.set(n.id, []));
    edges.forEach((e) => adj.get(e.source)?.push(e.target));

    const visited = new Set<string>();
    for (const load of loadNodes) {
      const queue = [load.id];
      while (queue.length > 0) {
        const id = queue.shift()!;
        if (visited.has(id)) continue;
        visited.add(id);
        for (const next of adj.get(id) || []) queue.push(next);
      }
    }

    return nodes.filter((n) => visited.has(n.id));
  }

  private async processNode(
    node: PipelineNode,
    canvas: HTMLCanvasElement
  ): Promise<HTMLCanvasElement> {
    switch (node.type) {
      case "resize":
        return applyResize(canvas, node.data as any);
      case "crop":
        return applyCrop(canvas, node.data as any);
      case "watermark":
        return applyWatermark(canvas, node.data as any);
      case "format":
        return canvas;
      case "compress":
        return canvas;
      case "denoise":
        return applyDenoise(canvas, node.data as any);
      case "rename":
        return canvas;
      case "load":
        return canvas;
      case "export":
        return canvas;
      default:
        return canvas;
    }
  }

  private topologicalSortNodes(
    nodes: PipelineNode[],
    edges: PipelineEdge[]
  ): PipelineNode[] {
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const inDegree = new Map<string, number>();
    const adj = new Map<string, string[]>();

    nodes.forEach((n) => {
      inDegree.set(n.id, 0);
      adj.set(n.id, []);
    });

    edges.forEach((e) => {
      adj.get(e.source)?.push(e.target);
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    });

    const queue: string[] = [];
    inDegree.forEach((deg, id) => {
      if (deg === 0) queue.push(id);
    });

    const result: PipelineNode[] = [];
    while (queue.length > 0) {
      const id = queue.shift()!;
      const node = nodeMap.get(id);
      if (node) result.push(node);
      for (const neighbor of adj.get(id) || []) {
        const newDeg = (inDegree.get(neighbor) || 1) - 1;
        inDegree.set(neighbor, newDeg);
        if (newDeg === 0) queue.push(neighbor);
      }
    }

    return result;
  }
}
