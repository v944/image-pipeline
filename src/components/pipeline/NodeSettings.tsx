import { useCallback, useEffect, useRef, useState } from "react";
import { usePipelineStore } from "../../stores/pipeline.store";
import { useFilesStore } from "../../stores/files.store";

interface Size { w: number; h: number }

export function NodeSettings() {
  const selectedNodeId = usePipelineStore((s) => s.selectedNodeId);
  const nodes = usePipelineStore((s) => s.nodes);
  const updateNodeData = usePipelineStore((s) => s.updateNodeData);

  const node = nodes.find((n) => n.id === selectedNodeId);

  if (!node) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm mt-8">
        Select a node to edit its settings
      </div>
    );
  }

  const handleChange = (key: string, value: unknown) => {
    updateNodeData(node.id, { [key]: value });
  };

  return (
    <div className="p-4 space-y-4">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        {node.type.charAt(0).toUpperCase() + node.type.slice(1)} Settings
      </div>

      {node.type === "resize" && (
        <>
          <Field label="Width" hint="px, leave empty for auto">
            <input
              type="number"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200"
              value={(node.data.width as string) || ""}
              onChange={(e) => handleChange("width", e.target.value ? Number(e.target.value) : null)}
              placeholder="Auto"
            />
          </Field>
          <Field label="Height" hint="px, leave empty for auto">
            <input
              type="number"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200"
              value={(node.data.height as string) || ""}
              onChange={(e) => handleChange("height", e.target.value ? Number(e.target.value) : null)}
              placeholder="Auto"
            />
          </Field>
          <SelectField
            label="Mode"
            value={node.data.mode as string}
            onChange={(v) => handleChange("mode", v)}
            options={[
              { value: "fit", label: "Fit" },
              { value: "fill", label: "Fill" },
              { value: "stretch", label: "Stretch" },
            ]}
          />
          <SelectField
            label="Algorithm"
            value={node.data.algorithm as string}
            onChange={(v) => handleChange("algorithm", v)}
            options={[
              { value: "auto", label: "Standard (Canvas)" },
              { value: "lanczos", label: "Lanczos3 (Sharper)" },
            ]}
            hint="Recommended for upscaling"
          />
          {(node.data.algorithm as string) === "lanczos" && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <span className="text-amber-400 text-xs leading-relaxed flex-1">
                Lanczos3 processes each pixel individually and may be noticeably slower on large images (&gt;5 MP).
              </span>
            </div>
          )}
        </>
      )}

      {node.type === "crop" && (
        <>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400">Crop Preview</label>
            <CropPreview
              nodeId={node.id}
              data={node.data}
              onUpdate={(d) => updateNodeData(node.id, d)}
            />
          </div>
          <Field label="X">
            <input
              type="number"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200"
              value={(node.data.x as number) || 0}
              onChange={(e) => handleChange("x", Number(e.target.value))}
            />
          </Field>
          <Field label="Y">
            <input
              type="number"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200"
              value={(node.data.y as number) || 0}
              onChange={(e) => handleChange("y", Number(e.target.value))}
            />
          </Field>
          <Field label="Width">
            <input
              type="number"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200"
              value={(node.data.width as number) || 0}
              onChange={(e) => handleChange("width", Number(e.target.value))}
            />
          </Field>
          <Field label="Height">
            <input
              type="number"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200"
              value={(node.data.height as number) || 0}
              onChange={(e) => handleChange("height", Number(e.target.value))}
            />
          </Field>
          <SelectField
            label="Unit"
            value={node.data.unit as string}
            onChange={(v) => handleChange("unit", v)}
            options={[
              { value: "px", label: "Pixels" },
              { value: "percent", label: "Percent" },
            ]}
          />
        </>
      )}

      {node.type === "compress" && (
        <>
          <Field label="Quality" hint="1-100">
            <input
              type="range"
              min="1"
              max="100"
              className="w-full accent-amber-500"
              value={(node.data.quality as number) || 85}
              onChange={(e) => handleChange("quality", Number(e.target.value))}
            />
            <span className="text-xs text-gray-400">{node.data.quality as number}%</span>
          </Field>
          <SelectField
            label="Method"
            value={node.data.method as string}
            onChange={(v) => handleChange("method", v)}
            options={[
              { value: "lossy", label: "Lossy" },
              { value: "lossless", label: "Lossless" },
            ]}
          />
        </>
      )}

      {node.type === "format" && (
        <SelectField
          label="Target Format"
          value={node.data.targetFormat as string}
          onChange={(v) => handleChange("targetFormat", v)}
          options={[
            { value: "PNG", label: "PNG" },
            { value: "JPEG", label: "JPEG" },
            { value: "WebP", label: "WebP" },
            { value: "AVIF", label: "AVIF" },
          ]}
        />
      )}

      {node.type === "watermark" && (
        <>
          <Field label="Text">
            <input
              type="text"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200"
              value={(node.data.text as string) || ""}
              onChange={(e) => handleChange("text", e.target.value)}
              placeholder="© Your Name"
            />
          </Field>
          <SelectField
            label="Position"
            value={node.data.position as string}
            onChange={(v) => handleChange("position", v)}
            options={[
              { value: "bottom-right", label: "Bottom Right" },
              { value: "bottom-left", label: "Bottom Left" },
              { value: "top-right", label: "Top Right" },
              { value: "top-left", label: "Top Left" },
              { value: "center", label: "Center" },
            ]}
          />
          <Field label="Font Size">
            <input
              type="number"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200"
              value={(node.data.fontSize as number) || 24}
              onChange={(e) => handleChange("fontSize", Number(e.target.value))}
            />
          </Field>
          <Field label="Opacity" hint="0-1">
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              className="w-full accent-amber-500"
              value={(node.data.opacity as number) || 0.5}
              onChange={(e) => handleChange("opacity", Number(e.target.value))}
            />
          </Field>
        </>
      )}

      {node.type === "rename" && (
        <Field label="Pattern" hint="{original}_{index}">
          <input
            type="text"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 font-mono"
            value={(node.data.pattern as string) || "{original}_{index}"}
            onChange={(e) => handleChange("pattern", e.target.value)}
          />
        </Field>
      )}

      {node.type === "load" && (
        <FileSelectField
          label="Source File"
          value={node.data.fileId as string | null}
          onChange={(v) => handleChange("fileId", v)}
        />
      )}

      {node.type === "export" && (
        <>
          <SelectField
            label="Format"
            value={node.data.format as string}
            onChange={(v) => handleChange("format", v)}
            options={[
              { value: "PNG", label: "PNG" },
              { value: "JPEG", label: "JPEG" },
              { value: "WebP", label: "WebP" },
            ]}
          />
          <Field label="Quality" hint="1-100">
            <input
              type="range"
              min="1"
              max="100"
              className="w-full accent-amber-500"
              value={(node.data.quality as number) || 85}
              onChange={(e) => handleChange("quality", Number(e.target.value))}
            />
            <span className="text-xs text-gray-400">{node.data.quality as number}%</span>
          </Field>
        </>
      )}
    </div>
  );
}

function findUpstreamLoadNode(
  nodeId: string,
  nodes: { id: string; type: string; data: Record<string, unknown> }[],
  edges: { source: string; target: string }[]
): { id: string; data: Record<string, unknown> } | null {
  const incoming = edges.filter((e) => e.target === nodeId);
  for (const edge of incoming) {
    const src = nodes.find((n) => n.id === edge.source);
    if (!src) continue;
    if (src.type === "load") return src;
    const found = findUpstreamLoadNode(src.id, nodes, edges);
    if (found) return found;
  }
  return null;
}

function CropPreview({
  nodeId,
  data,
  onUpdate,
}: {
  nodeId: string;
  data: Record<string, unknown>;
  onUpdate: (d: Record<string, unknown>) => void;
}) {
  const nodes = usePipelineStore((s) => s.nodes);
  const edges = usePipelineStore((s) => s.edges);
  const files = useFilesStore((s) => s.files);

  const imgRef = useRef<HTMLImageElement>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [natural, setNatural] = useState<Size>({ w: 0, h: 0 });
  const [scale, setScale] = useState(1);

  const loadNode = findUpstreamLoadNode(nodeId, nodes, edges);
  const fileId = loadNode?.data?.fileId as string | undefined;
  const matchedFile = fileId ? files.find((f) => f.id === fileId) : null;
  const file = matchedFile || files[0] || null;

  const cropW = (data.width as number) || 0;
  const cropH = (data.height as number) || 0;

  useEffect(() => {
    if (!file?.blobUrl) { setImg(null); setNatural({ w: 0, h: 0 }); return; }
    const image = new Image();
    image.onload = () => {
      setImg(image);
      setNatural({ w: image.naturalWidth, h: image.naturalHeight });
      if (cropW > image.naturalWidth || cropH > image.naturalHeight) {
        onUpdate({
          width: image.naturalWidth,
          height: image.naturalHeight,
          x: 0,
          y: 0,
        });
      }
    };
    image.src = file.blobUrl;
  }, [file?.blobUrl]);

  const updateScale = useCallback(() => {
    const el = imgRef.current;
    if (!el || !natural.w) return;
    setScale(el.getBoundingClientRect().width / natural.w);
  }, [natural.w]);

  useEffect(() => {
    updateScale();
    window.addEventListener("resize", updateScale);
    const ro = new ResizeObserver(updateScale);
    if (imgRef.current) ro.observe(imgRef.current.parentElement!);
    return () => {
      window.removeEventListener("resize", updateScale);
      ro.disconnect();
    };
  }, [updateScale, img]);

  const isPercent = (data.unit as string) === "percent";
  const cropX = (data.x as number) || 0;
  const cropY = (data.y as number) || 0;

  const toPx = (v: number, dim: "w" | "h") => {
    if (isPercent) return (v / 100) * natural[dim];
    return v;
  };
  const px = toPx(cropX, "w") * scale;
  const py = toPx(cropY, "h") * scale;
  const pw = toPx(cropW, "w") * scale;
  const ph = toPx(cropH, "h") * scale;

  const [drag, setDrag] = useState<{
    mode: "move" | "nw" | "ne" | "sw" | "se";
    ox: number;
    oy: number;
    ix: number;
    iy: number;
    iw: number;
    ih: number;
  } | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, mode: "move" | "nw" | "ne" | "sw" | "se") => {
      e.preventDefault();
      e.stopPropagation();
      setDrag({ mode, ox: e.clientX, oy: e.clientY, ix: cropX, iy: cropY, iw: cropW, ih: cropH });
    },
    [cropX, cropY, cropW, cropH]
  );

  useEffect(() => {
    if (!drag) return;
    const maxW = isPercent ? 100 : natural.w;
    const maxH = isPercent ? 100 : natural.h;
    const onMove = (e: MouseEvent) => {
      const dx = (e.clientX - drag.ox) / (scale || 1);
      const dy = (e.clientY - drag.oy) / (scale || 1);

      let nx = drag.ix, ny = drag.iy, nw = drag.iw, nh = drag.ih;

      if (drag.mode === "move") { nx += dx; ny += dy; }
      else if (drag.mode === "se") { nw += dx; nh += dy; }
      else if (drag.mode === "sw") { const raw = Math.max(1, drag.iw - dx); nw = Math.min(raw, drag.ix + drag.iw); nx = (drag.ix + drag.iw) - nw; nh = drag.ih + dy; }
      else if (drag.mode === "ne") { const raw = Math.max(1, drag.ih - dy); nh = Math.min(raw, drag.iy + drag.ih); ny = (drag.iy + drag.ih) - nh; nw = drag.iw + dx; }
      else if (drag.mode === "nw") { const rw = Math.max(1, drag.iw - dx); nw = Math.min(rw, drag.ix + drag.iw); nx = (drag.ix + drag.iw) - nw; const rh = Math.max(1, drag.ih - dy); nh = Math.min(rh, drag.iy + drag.ih); ny = (drag.iy + drag.ih) - nh; }

      nw = Math.max(1, Math.min(nw, maxW - nx));
      nh = Math.max(1, Math.min(nh, maxH - ny));
      nx = Math.max(0, Math.min(nx, maxW - nw));
      ny = Math.max(0, Math.min(ny, maxH - nh));

      onUpdate({ x: Math.round(nx), y: Math.round(ny), width: Math.round(nw), height: Math.round(nh) });
    };
    const onUp = () => setDrag(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [drag, scale, isPercent, natural, onUpdate]);

  if (!file) {
    return (
      <div className="text-xs text-gray-500 text-center py-4 border border-dashed border-white/10 rounded-lg">
        Connect a Load node with a file
      </div>
    );
  }

  if (!img) {
    return (
      <div className="text-xs text-gray-500 text-center py-4 border border-dashed border-white/10 rounded-lg">
        Loading image...
      </div>
    );
  }

  return (
    <div className="relative select-none">
      <img
        ref={imgRef}
        src={img.src}
        alt="Crop preview"
        className="block w-full rounded-lg"
        draggable={false}
        onLoad={updateScale}
      />
      {pw > 0 && ph > 0 && (
        <>
          <div
            className="absolute inset-0 bg-black/50 pointer-events-none rounded-lg"
            style={{
              clipPath: `polygon(
                0% 0%, 100% 0%, 100% 100%, 0% 100%,
                0% 0%, ${px}px 0%, ${px}px ${py + ph}px, ${(px + pw)}px ${py + ph}px,
                ${(px + pw)}px ${py}px, ${px}px ${py}px,
                ${px}px 0%, 0% 0%
              )`,
            }}
          />
          <div
            className="absolute border-2 border-amber-400 cursor-move"
            style={{ left: px, top: py, width: pw, height: ph }}
            onMouseDown={(e) => handleMouseDown(e, "move")}
          >
            <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-amber-400 rounded-sm cursor-nw-resize" onMouseDown={(e) => handleMouseDown(e, "nw")} />
            <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-amber-400 rounded-sm cursor-ne-resize" onMouseDown={(e) => handleMouseDown(e, "ne")} />
            <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-amber-400 rounded-sm cursor-sw-resize" onMouseDown={(e) => handleMouseDown(e, "sw")} />
            <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-amber-400 rounded-sm cursor-se-resize" onMouseDown={(e) => handleMouseDown(e, "se")} />
          </div>
        </>
      )}
    </div>
  );
}

function FileSelectField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const files = useFilesStore((s) => s.files);
  const activeFiles = files.filter((f) => f.status !== "blocked");
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (value && !activeFiles.find((f) => f.id === value) && activeFiles.length > 0) {
      onChangeRef.current(activeFiles[0].id);
    }
  }, [activeFiles, value]);

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-gray-400">{label}</label>
      <select
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
      >
        <option value="" className="bg-[#0D0D14]" disabled>
          {activeFiles.length === 0 ? "No processable files" : "Select a file..."}
        </option>
        {activeFiles.map((f) => (
          <option key={f.id} value={f.id} className="bg-[#0D0D14]">
            {f.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-400">{label}</label>
        {hint && <span className="text-[10px] text-gray-600">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-400">{label}</label>
        {hint && <span className="text-[10px] text-gray-600">{hint}</span>}
      </div>
      <select
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-[#0D0D14]">
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
