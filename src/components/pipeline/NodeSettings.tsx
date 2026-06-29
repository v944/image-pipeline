import { usePipelineStore } from "../../stores/pipeline.store";

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
        </>
      )}

      {node.type === "crop" && (
        <>
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-gray-400">{label}</label>
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
