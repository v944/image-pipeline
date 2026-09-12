import { describe, it, expect } from "vitest";
import { resolveActiveChain } from "../core/chain";
import type { PipelineNode, PipelineEdge } from "../types/pipeline.types";

function node(
  id: string,
  type: string,
  data: Record<string, unknown> = {},
  enabled = true
): PipelineNode {
  return { id, type: type as any, position: { x: 0, y: 0 }, data, label: null, enabled };
}

function edge(id: string, source: string, target: string): PipelineEdge {
  return { id, source, target };
}

describe("resolveActiveChain", () => {
  it("processes all non-load nodes when no load node exists", () => {
    const nodes = [
      node("n1", "resize", { width: 2400 }),
      node("n2", "export"),
    ];
    const ids = resolveActiveChain(nodes, []).map((n) => n.id);
    expect(ids).toEqual(["n1", "n2"]);
  });

  it("processes all non-load nodes when load node has no fileId selected", () => {
    const nodes = [
      node("n1", "load", { fileId: null }),
      node("n2", "resize", { width: 2400 }),
      node("n3", "export"),
    ];
    const ids = resolveActiveChain(nodes, [edge("e1", "n1", "n2"), edge("e2", "n2", "n3")]).map((n) => n.id);
    expect(ids).toEqual(["n2", "n3"]);
  });

  it("returns only nodes reachable from a load node when fileId is set", () => {
    const nodes = [
      node("n1", "load", { fileId: "file-1" }),
      node("n2", "resize", { width: 2400 }),
      node("n3", "export"),
      node("n4", "grayscale"),
    ];
    const edges = [edge("e1", "n1", "n2"), edge("e2", "n2", "n3")];
    const ids = resolveActiveChain(nodes, edges).map((n) => n.id);
    expect(ids).toEqual(["n2", "n3"]);
  });

  it("excludes disabled nodes", () => {
    const nodes = [
      node("n1", "resize", { width: 2400 }),
      node("n2", "grayscale", {}, false),
      node("n3", "export"),
    ];
    const ids = resolveActiveChain(nodes, []).map((n) => n.id);
    expect(ids).toEqual(["n1", "n3"]);
  });

  it("treats load node without fileId as unreachable and falls back to all nodes", () => {
    const nodes = [
      node("n1", "load", { fileId: null }),
      node("n2", "crop", {}),
    ];
    const ids = resolveActiveChain(nodes, [edge("e1", "n1", "n2")]).map((n) => n.id);
    expect(ids).toEqual(["n2"]);
  });
});