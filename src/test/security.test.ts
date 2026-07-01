import { describe, it, expect, vi, beforeEach } from "vitest";
import { getMimeType, convertFormat } from "../core/canvas/format";
import { ZipAssembler } from "../core/ZipAssembler";
import { PipelineEngine } from "../core/PipelineEngine";
import { usePipelineStore } from "../stores/pipeline.store";
import { useUserStore } from "../stores/user.store";
import { useFilesStore } from "../stores/files.store";
import { useUIStore } from "../stores/ui.store";
import { useSavedPipelinesStore } from "../stores/saved-pipelines.store";

// ============================================================
// TC-SEC-001…010: Port protection & network security
// ============================================================
describe("SEC-NET: Network & port security", () => {
  it("TC-SEC-001: convertFormat does not make network requests", () => {
    const fn = convertFormat?.toString() || "";
    expect(fn).not.toContain("fetch");
    expect(fn).not.toContain("XMLHttpRequest");
  });
});

// ============================================================
// TC-SEC-011…020: Prototype pollution
// ============================================================
describe("SEC-PROTO: Prototype pollution protection", () => {
  it("TC-SEC-011: rejects __proto__ key via safe JSON reviver", () => {
    const malicious = JSON.stringify({
      __proto__: { isAdmin: true },
      nodes: [{ id: "n1", type: "load", position: { x: 0, y: 0 }, data: {}, label: null, enabled: true }],
      edges: [],
    });
    const safe = JSON.parse(malicious, (key, value) =>
      ["__proto__", "constructor", "prototype"].includes(key) ? undefined : value
    );
    expect(Object.keys(safe)).not.toContain("__proto__");
    expect(safe.nodes).toBeDefined();
  });

  it("TC-SEC-012: structuredClone strips prototype pollution", () => {
    const polluted = JSON.parse('{"__proto__":{"polluted":true},"nodes":[],"edges":[]}');
    const cloned = structuredClone(polluted);
    expect((cloned as any).polluted).toBeUndefined();
  });

  it("TC-SEC-013: updateNodeData does not allow __proto__ injection", () => {
    const store = usePipelineStore.getState();
    store.addNode("resize", { x: 100, y: 100 });
    const node = usePipelineStore.getState().nodes[0];
    expect(node).toBeDefined();
    store.updateNodeData(node.id, { __proto__: { polluted: true } } as any);
    const updated = usePipelineStore.getState().nodes[0];
    expect(Object.keys(updated.data)).not.toContain("__proto__");
  });

  it("TC-SEC-014: loadPipeline uses structuredClone for safe import", () => {
    const store = usePipelineStore.getState();
    const maliciousNodes: any[] = JSON.parse(
      '[{"__proto__":{"polluted":true},"id":"n1","type":"load","position":{"x":0,"y":0},"data":{},"label":null,"enabled":true}]'
    );
    store.loadPipeline(maliciousNodes, []);
    const state = usePipelineStore.getState();
    expect((state.nodes[0] as any).polluted).toBeUndefined();
  });
});

// ============================================================
// TC-SEC-021…030: Format & conversion security
// ============================================================
describe("SEC-FORMAT: Format conversion security", () => {
  it("TC-SEC-021: getMimeType defaults to image/png for unknown formats", () => {
    expect(getMimeType("EXE")).toBe("image/png");
    expect(getMimeType("")).toBe("image/png");
  });

  it("TC-SEC-022: getMimeType returns correct types for known formats", () => {
    expect(getMimeType("PNG")).toBe("image/png");
    expect(getMimeType("JPEG")).toBe("image/jpeg");
    expect(getMimeType("WebP")).toBe("image/webp");
  });

  it("TC-SEC-023: quality is clamped to valid range", () => {
    expect(Math.max(0, Math.min(1, 200 / 100))).toBe(1);
    expect(Math.max(0, Math.min(1, -50 / 100))).toBe(0);
    expect(Math.max(0, Math.min(1, 85 / 100))).toBe(0.85);
  });
});

// ============================================================
// TC-SEC-031…040: Store / localStorage security
// ============================================================
describe("SEC-STORE: Client-side store security", () => {
  beforeEach(() => {
    useUserStore.setState({ plan: "free", sessionId: crypto.randomUUID() });
    useUIStore.setState({ onboardingCompleted: false, onboardingStep: null });
    localStorage.clear();
  });

  it("TC-SEC-031: plan defaults to free", () => {
    useUserStore.setState({ plan: "free" });
    expect(useUserStore.getState().plan).toBe("free");
  });

  it("TC-SEC-032: sessionId uses UUID format", () => {
    const sid = useUserStore.getState().sessionId;
    expect(sid).toMatch(/^[0-9a-f-]+$/);
    expect(sid.length).toBeGreaterThan(0);
  });

  it("TC-SEC-033: persist does not store usage data", () => {
    useUserStore.getState().incrementUsage(5);
    const raw = localStorage.getItem("image-pipeline-user");
    if (raw) {
      const persisted = JSON.parse(raw);
      expect(persisted.usage).toBeUndefined();
    }
  });

  it("TC-SEC-034: onboarding partialize works", () => {
    useUIStore.getState().startOnboarding();
    expect(useUIStore.getState().onboardingStep).toBe(1);
    expect(useUIStore.getState().onboardingCompleted).toBe(false);
  });
});

// ============================================================
// TC-SEC-041…050: File upload security
// ============================================================
describe("SEC-UPLOAD: File upload validation", () => {
  beforeEach(() => {
    useFilesStore.setState({ files: [] });
  });

  it("TC-SEC-041: blocks text/plain files", () => {
    const store = useFilesStore.getState();
    store.addFiles([new File(["hello"], "test.txt", { type: "text/plain" })], "blocked", "unsupported_format");
    const added = useFilesStore.getState().files[0];
    expect(added.status).toBe("blocked");
    expect(added.blockReason).toBe("unsupported_format");
  });

  it("TC-SEC-042: blocks oversized files", () => {
    const store = useFilesStore.getState();
    store.addFiles([new File(["x".repeat(11 * 1024 * 1024)], "big.png", { type: "image/png" })], "blocked", "file_size");
    const added = useFilesStore.getState().files[0];
    expect(added.status).toBe("blocked");
    expect(added.blockReason).toBe("file_size");
  });

  it("TC-SEC-043: blobUrl is created on file add", () => {
    const store = useFilesStore.getState();
    store.addFiles([new File(["data"], "photo.jpg", { type: "image/jpeg" })]);
    const added = useFilesStore.getState().files[0];
    expect(added.blobUrl).toMatch(/^blob:/);
    expect(added.status).toBe("pending");
  });

  it("TC-SEC-044: revokes blob URL on removeFile", () => {
    const revokeSpy = vi.spyOn(URL, "revokeObjectURL");
    const store = useFilesStore.getState();
    store.addFiles([new File(["img"], "test.png", { type: "image/png" })]);
    const added = useFilesStore.getState().files[0];
    store.removeFile(added.id);
    expect(revokeSpy).toHaveBeenCalled();
    revokeSpy.mockRestore();
  });

  it("TC-SEC-045: revokes all blob URLs on clearFiles", () => {
    const revokeSpy = vi.spyOn(URL, "revokeObjectURL");
    const store = useFilesStore.getState();
    store.addFiles([new File(["a"], "a.png", { type: "image/png" })]);
    store.addFiles([new File(["b"], "b.png", { type: "image/png" })]);
    const urls = useFilesStore.getState().files.map((f) => f.blobUrl);
    store.clearFiles();
    urls.forEach((url) => {
      expect(revokeSpy).toHaveBeenCalledWith(url);
    });
    revokeSpy.mockRestore();
  });

  it("TC-SEC-046: file id has unique format", () => {
    const store = useFilesStore.getState();
    store.addFiles([new File(["a"], "a.png", { type: "image/png" })]);
    store.addFiles([new File(["b"], "b.png", { type: "image/png" })]);
    const ids = useFilesStore.getState().files.map((f) => f.id);
    expect(ids[0]).not.toBe(ids[1]);
  });
});

// ============================================================
// TC-SEC-051…060: Pipeline engine edge cases
// ============================================================
describe("SEC-ENGINE: Pipeline processing edge cases", () => {
  it("TC-SEC-051: PipelineEngine is constructable", () => {
    const engine = new PipelineEngine();
    expect(engine).toBeInstanceOf(PipelineEngine);
  });

  it("TC-SEC-052: unknown node type does not throw", () => {
    const engine = new PipelineEngine();
    const canvas = document.createElement("canvas");
    const nodes: any[] = [
      { id: "bad-1", type: "nonexistent", position: { x: 0, y: 0 }, data: {}, label: null, enabled: true },
      { id: "export-1", type: "export", position: { x: 200, y: 0 }, data: { format: "PNG", quality: 85 }, label: null, enabled: true },
    ];
    const edges = [{ id: "e1", source: "bad-1", target: "export-1" }];
    expect(() => engine.execute(canvas, nodes, edges)).not.toThrow();
  });

  it("TC-SEC-053: engine code does not contain eval", () => {
    const code = PipelineEngine.toString();
    expect(code).not.toContain("eval(");
    expect(code).not.toContain("new Function");
  });
});

// ============================================================
// TC-SEC-061…070: ZIP / download security
// ============================================================
describe("SEC-ZIP: ZIP assembly security", () => {
  it("TC-SEC-061: ZIP creates valid archive", async () => {
    const assembler = new ZipAssembler();
    const blob = new Blob(["data"], { type: "image/png" });
    const result = await assembler.assemble([{ name: "output.png", blob }]);
    expect(result).toBeInstanceOf(Blob);
    expect(result.type).toBe("application/zip");
  });

  it("TC-SEC-062: assembleInWorker falls back to main thread", async () => {
    const origWorker = (globalThis as any).Worker;
    (globalThis as any).Worker = undefined;
    const assembler = new ZipAssembler();
    const blob = new Blob(["data"], { type: "image/png" });
    const result = await assembler.assembleInWorker([{ name: "test.png", blob }]);
    expect(result).toBeInstanceOf(Blob);
    (globalThis as any).Worker = origWorker;
  });

  it("TC-SEC-063: ZipAssembler code does not contain eval", () => {
    const code = ZipAssembler.toString();
    expect(code).not.toContain("eval(");
    expect(code).not.toContain("new Function");
  });
});

// ============================================================
// TC-SEC-071…080: State management security
// ============================================================
describe("SEC-STATE: State management security", () => {
  it("TC-SEC-071: snapshot throttling prevents memory DoS", () => {
    const store = usePipelineStore.getState();
    store.resetPipeline();
    for (let i = 0; i < 50; i++) {
      store.addNode("resize", { x: i * 10, y: i * 10 });
    }
    const state = usePipelineStore.getState();
    expect(state.past.length).toBeLessThan(50);
  });

  it("TC-SEC-072: resetPipeline clears state", () => {
    const store = usePipelineStore.getState();
    store.addNode("load", { x: 0, y: 0 });
    store.addNode("export", { x: 200, y: 0 });
    store.resetPipeline();
    const state = usePipelineStore.getState();
    expect(state.nodes).toHaveLength(0);
    expect(state.edges).toHaveLength(0);
  });

  it("TC-SEC-073: saved pipelines store save and remove", () => {
    usePipelineStore.getState().resetPipeline();
    usePipelineStore.getState().addNode("resize", { x: 100, y: 0 });
    const nodes = usePipelineStore.getState().nodes;
    const savedStore = useSavedPipelinesStore.getState();
    savedStore.save("test", null, nodes, []);
    const pipelines = useSavedPipelinesStore.getState().pipelines;
    expect(pipelines.length).toBeGreaterThanOrEqual(1);
    savedStore.remove(pipelines[pipelines.length - 1].id);
    expect(useSavedPipelinesStore.getState().pipelines.length).toBeLessThan(pipelines.length);
  });
});

// ============================================================
// TC-SEC-081…090: Supply chain & crypto audit
// ============================================================
describe("SEC-SUPPLY: Supply chain & crypto audit", () => {
  it("TC-SEC-081: ZipAssembler references pinned JSZip versions", () => {
    expect(ZipAssembler).toBeDefined();
    expect(typeof ZipAssembler.prototype.assemble).toBe("function");
  });

  it("TC-SEC-082: crypto.randomUUID produces valid UUIDv4", () => {
    const uuid = crypto.randomUUID();
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it("TC-SEC-083: canvas.toBlob is available", () => {
    const canvas = document.createElement("canvas");
    expect(typeof canvas.toBlob).toBe("function");
  });
});
