import { describe, it, expect } from "vitest";
import { PipelineEngine } from "../core/PipelineEngine";
import type { PipelineNode, PipelineEdge } from "../types/pipeline.types";

function node(
  id: string,
  type: string,
  data: Record<string, unknown> = {},
  enabled = true
): PipelineNode {
  return {
    id,
    type: type as never,
    position: { x: 0, y: 0 },
    data,
    label: null,
    enabled,
  };
}

function edge(id: string, source: string, target: string): PipelineEdge {
  return { id, source, target };
}

/**
 * Runs engine.execute and buckets the ONE catastrophic outcome we guard
 * against -- a genuine call-stack overflow ("stack-overflow") -- from everything
 * else. happy-dom does not provide a real 2D canvas context, so a canvas-backed
 * pipeline may fail for benign "context unavailable" reasons in this
 * environment. None of that is what this regression guards. The one thing that
 * must NEVER return is the RangeError from the stack overflow itself.
 */
async function runSafely(
  engine: PipelineEngine,
  canvas: HTMLCanvasElement,
  nodes: PipelineNode[],
  edges: PipelineEdge[]
): Promise<"stack-overflow" | "finished" | string> {
  try {
    const results = await engine.execute(canvas, nodes, edges);
    return Array.isArray(results) ? "finished" : String(results);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (
      err instanceof RangeError ||
      /maximum call stack|stack size exceeded|call stack size/i.test(msg)
    ) {
      return "stack-overflow";
    }
    return msg;
  }
}

/**
 * Exactly the graphs that used to blow the call stack. The chain resolver gates
 * on the load node (or falls back to all non-load nodes), so the engine sorts a
 * SUBSET of nodes but was handed raw edges that also reference nodes OUTSIDE
 * that subset (the load node itself, or any other excluded node). Edges like
 * load -> resize are not cycle edges, so the defensive reparenting loop never
 * removed them "-- and topologicalSortNodes recurred on the identical edge set
 * forever "-- "Maximum call stack size exceeded" per file.
 */
describe("cycle-engine: execute never overflows on excluded-source edges", () => {
  it("TC-ENG-CYC-101: cyclic resize-export graph with load edge does not overflow", async () => {
    const engine = new PipelineEngine();
    const canvas = document.createElement("canvas");
    canvas.width = 6000;
    canvas.height = 3000;

    const nodes = [
      node("load", "load", { fileId: "file-1" }),
      node("resize", "resize", { width: 2400 }),
      node("export", "export", { format: "JPG" }),
    ];
    const edges = [
      edge("e1", "load", "resize"),
      edge("e2", "resize", "export"),
      edge("e3", "export", "resize"),
    ];

    const outcome = await runSafely(engine, canvas, nodes, edges);
    expect(outcome).not.toBe("stack-overflow");
  });

  it("TC-ENG-CYC-102: no-load fallback with self-referential export edge does not overflow", async () => {
    const engine = new PipelineEngine();
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 800;

    const nodes = [
      node("resize", "resize", { width: 2400 }),
      node("export", "export", { format: "PNG" }),
    ];
    const edges = [
      edge("e1", "resize", "export"),
      edge("e2", "export", "resize"),
    ];

    const outcome = await runSafely(engine, canvas, nodes, edges);
    expect(outcome).not.toBe("stack-overflow");
  });

  it("TC-ENG-CYC-103: excluded/disabled node with an incoming edge never starves the queue", async () => {
    const engine = new PipelineEngine();
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 400;

    const nodes = [
      node("load", "load", { fileId: "file-1" }),
      node("disabled", "crop", {}, false),
      node("resize", "resize", { width: 1600 }),
    ];
    const edges = [edge("e1", "disabled", "resize")];

    const outcome = await runSafely(engine, canvas, nodes, edges);
    expect(outcome).not.toBe("stack-overflow");
  });
});