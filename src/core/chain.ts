import type { PipelineNode, PipelineEdge } from "../types/pipeline.types";

/**
 * True if adding an edge source -> target to `edges` would already form a
 * cycle (i.e. target can reach source through existing edges). Self-loops are
 * always cycleshare.
 *
 * Used by:
 *  - PipelineEngine.topologicalSortNodes as a defensive backstop so that a
 *    user-saved cyclic pipeline never makes the engine throw "Pipeline
 *    contains a cycle ..." per file (we rebuild a cycle-free edge subset and
 *    sort that instead).
 *  - PipelineEngine.addEdge guard in the store (wouldCreateCycleInEdges).
 */
export function wouldCreateCycleInEdges(
  edges: PipelineEdge[],
  source: string,
  target: string
): boolean {
  if (source === target) return true;
  const adj = new Map<string, string[]>();
  for (const e of edges) {
    if (!adj.has(e.source)) adj.set(e.source, []);
    adj.get(e.source)!.push(e.target);
  }
  const stack = [target];
  const visited = new Set<string>();
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (id === source) return true;
    if (visited.has(id)) continue;
    visited.add(id);
    for (const next of adj.get(id) || []) stack.push(next);
  }
  return false;
}

/**
 * Resolve which nodes are part of the active processing chain and return them
 * as an array (PipelineNode[]). Cycle edges are always dropped while walking
 * the graph so the engine's topological sort never throws.
 *
 * Rule:
 *  - If at least one 'load' node has a fileId selected, only nodes reachable
 *    from those load nodes (BFS over edges) are active.
 *  - Otherwise ALL enabled non-load nodes are active. This is the key fallback
 *    that prevents the engine from silently skipping the pipeline (e.g. a
 *    resize -> export graph whose load node has no file picked yet, or no load
 *    node at all).
 */
export function resolveActiveChain(
  nodes: PipelineNode[],
  edges: PipelineEdge[]
): PipelineNode[] {
  const loadNodes = nodes.filter((n) => n.type === "load" && n.data?.fileId);

  // Node ids reachable from a load node (when gating applies).
  const activeNodeIds = new Set<string>();

  if (loadNodes.length > 0) {
    const adj = new Map<string, string[]>();
    nodes.forEach((n) => adj.set(n.id, []));
    edges.forEach((e) => adj.get(e.source)?.push(e.target));

    const queue = loadNodes.map((l) => l.id);
    while (queue.length > 0) {
      const id = queue.shift()!;
      if (activeNodeIds.has(id)) continue;
      activeNodeIds.add(id);
      for (const next of adj.get(id) || []) queue.push(next);
    }
  }

  return nodes.filter((n) => {
    if (n.enabled === false || n.type === "load") return false;
    if (loadNodes.length > 0) return activeNodeIds.has(n.id);
    return true;
  });
}
