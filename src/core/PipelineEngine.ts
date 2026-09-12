import { applyResize, applyCrop, applyWatermark, applyDenoise, applyEmotionFilter, applyBrightness, applyContrast, applyExposure, applyBlur, applySharpen, applyHsl, applyTemperature, applyGrayscale, applyRotate, convertFormat } from "./canvas";
import { resolveActiveChain, wouldCreateCycleInEdges } from "./chain";
import type { PipelineNode, PipelineEdge } from "../types/pipeline.types";

export class PipelineEngine {
  async execute(
    source: HTMLCanvasElement,
    nodes: PipelineNode[],
    edges: PipelineEdge[]
  ): Promise<Blob[]> {
    const chain = this.findActiveChain(nodes, edges);
    if (chain.length === 0) {
      return [await convertFormat(source, "PNG", 80)];
    }

    const sorted = this.topologicalSortNodes(chain, edges);
    const exportNodes = sorted.filter(
      (n) => n.type === "export" && n.enabled !== false
    );

    if (exportNodes.length === 0) {
      let canvas = source;
      for (const node of sorted) {
        if (node.enabled === false || node.type === "load") continue;
        canvas = await this.processNode(node, canvas);
      }
      return [await convertFormat(canvas, "PNG", 85)];
    }

    const results: Blob[] = [];
    for (const exportNode of exportNodes) {
      let canvas = source;
      for (const node of sorted) {
        if (node.enabled === false || node.type === "load") continue;
        if (node.type === "export" && node.id !== exportNode.id) continue;
        canvas = await this.processNode(node, canvas);
      }
      const format = (exportNode.data?.format as string) || "PNG";
      const quality = (exportNode.data?.quality as number) || 85;
      results.push(await convertFormat(canvas, format, quality));
    }

    return results;
  }

  private findActiveChain(
    nodes: PipelineNode[],
    edges: PipelineEdge[]
  ): PipelineNode[] {
    return resolveActiveChain(nodes, edges);
  }

  private processNode(
    node: PipelineNode,
    canvas: HTMLCanvasElement
  ): Promise<HTMLCanvasElement> {
    const data = node.data as Record<string, unknown> | undefined;
    switch (node.type) {
      case "resize":
        return Promise.resolve(
          applyResize(canvas, {
            width: (data?.width as number | null) ?? null,
            height: (data?.height as number | null) ?? null,
            mode: (data?.mode as "fit" | "fill" | "stretch") ?? "fit",
            keepAspectRatio: (data?.keepAspectRatio as boolean) ?? true,
          })
        );
      case "crop":
        return Promise.resolve(
          applyCrop(canvas, {
            x: (data?.x as number) ?? 0,
            y: (data?.y as number) ?? 0,
            width: (data?.width as number) ?? 0,
            height: (data?.height as number) ?? 0,
            unit: (data?.unit as "px" | "percent") ?? "px",
          })
        );
      case "watermark":
        return Promise.resolve(
          applyWatermark(canvas, {
            text: (data?.text as string) || "",
            position:
              (data?.position as
                | "top-left"
                | "top-right"
                | "bottom-left"
                | "bottom-right"
                | "center") ?? "bottom-right",
            fontSize: (data?.fontSize as number) ?? 40,
            opacity: (data?.opacity as number) ?? 70,
            color: data?.color as string | undefined,
          })
        );
      case "denoise":
        return Promise.resolve(
          applyDenoise(canvas, {
            method: "gaussian",
            strength: (data?.strength as number) ?? 12,
            radius: (data?.radius as number) ?? 25,
          })
        );
      case "emotion":
        return Promise.resolve(
          applyEmotionFilter(canvas, {
            emotion: (data?.mode as string) || "joy",
            intensity: (data?.intensity as number) ?? 80,
          })
        );
      case "brightness":
        return Promise.resolve(applyBrightness(canvas, { value: (data?.value as number) ?? 0 }));
      case "contrast":
        return Promise.resolve(applyContrast(canvas, { value: (data?.value as number) ?? 0 }));
      case "exposure":
        return Promise.resolve(applyExposure(canvas, { value: (data?.value as number) ?? 0 }));
      case "blur":
        return Promise.resolve(applyBlur(canvas, { value: (data?.radius as number) ?? 14 }));
      case "sharpen":
        return Promise.resolve(applySharpen(canvas, { value: (data?.amount as number) ?? 80 }));
      case "hsl":
        return Promise.resolve(
          applyHsl(canvas, {
            hue: (data?.hue as number) ?? 0,
            saturation: (data?.saturation as number) ?? 0,
            lightness: (data?.lightness as number) ?? 0,
          })
        );
      case "temperature":
        return Promise.resolve(applyTemperature(canvas, { value: (data?.value as number) ?? 5000 }));
      case "grayscale":
        return Promise.resolve(applyGrayscale(canvas, { value: 100 }));
      case "rotate":
        return Promise.resolve(
          applyRotate(canvas, {
            rotation:
              (data?.angle as string | undefined)?.toString() ||
              (data?.rotation as string | undefined) ||
              "none",
            flip:
              (data?.flip as string | undefined) ||
              (data?.flip as string | undefined) ||
              "none",
          })
        );
      case "load":
        return Promise.resolve(canvas);
      case "export":
        return Promise.resolve(canvas);
      default:
        return Promise.resolve(canvas);
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

    // Only edges whose endpoints are BOTH inside the executing chain count.
    // A raw saved edge may still reference a node that resolveActiveChain
    // excluded (typically the load node, when no file is selected yet, or
    // any other node gated out). Feeding that edge's TARGET into inDegree
    // adds in-degree from a phantom source no chain node owns -> Kahn"s
    // queue never empties it -> the result is permanently incomplete -> the
    // cycle backstop rebuilt the SAME edge list and recursed forever, which
    // is the exact "Maximum call stack size exceeded" seen per file in the
    // browser. Endpoint membership fixes it structurally (no recursion).
    const chainEndpoints = new Set<string>();
    edges.forEach((e) => {
      if (nodeMap.has(e.source) && nodeMap.has(e.target)) {
        chainEndpoints.add(e.source);
        chainEndpoints.add(e.target);
      }
    });
    const effectiveEdges = edges.filter(
      (e) => chainEndpoints.has(e.source) && chainEndpoints.has(e.target)
    );

    edges = effectiveEdges;

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
      for (const next of adj.get(id) || []) {
        const newDeg = (inDegree.get(next) || 1) - 1;
        inDegree.set(next, newDeg);
        if (newDeg === 0) queue.push(next);
      }
    }

    if (result.length !== nodes.length) {
      // Defensive backstop: a user can still connect a cycle edge directly
      // through other code paths (e.g. an older saved pipeline). Rather than
      // throwing and showing an error per file, reparent to a cycle-free
      // edge subset and re-sort. Membershipping above already eliminated the
      // phantom-inDegree source, so this rebuild strictly shrinks.
      const reparented: PipelineEdge[] = [];
      for (const e of edges) {
        if (wouldCreateCycleInEdges(reparented, e.source, e.target)) continue;
        reparented.push({ ...e, id: "t" + e.id });
      }
      return this.topologicalSortNodes(nodes, reparented);
    }

    return result;
  }
}