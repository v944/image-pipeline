import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "../../lib";
import type { NodeType } from "../../types";

const NODE_ICONS: Record<string, string> = {
  load: "📂",
  resize: "📐",
  crop: "✂️",
  compress: "📦",
  format: "🔄",
  watermark: "©",
  rename: "✏️",
  export: "💾",
};

const NODE_COLORS: Record<string, string> = {
  load: "border-blue-500/50 bg-blue-500/10",
  resize: "border-green-500/50 bg-green-500/10",
  crop: "border-purple-500/50 bg-purple-500/10",
  compress: "border-yellow-500/50 bg-yellow-500/10",
  format: "border-cyan-500/50 bg-cyan-500/10",
  watermark: "border-pink-500/50 bg-pink-500/10",
  rename: "border-orange-500/50 bg-orange-500/10",
  export: "border-red-500/50 bg-red-500/10",
};

interface BaseNodeData {
  label?: string | null;
  type: NodeType;
  [key: string]: unknown;
}

export const BaseNode = memo(({ data, selected }: NodeProps) => {
  const d = data as BaseNodeData;
  const nodeType = d.type;
  const icon = NODE_ICONS[nodeType] || "📄";
  const colorClass = NODE_COLORS[nodeType] || "border-gray-500/50 bg-gray-500/10";

  return (
    <div
      className={cn(
        "px-4 py-2 rounded-xl border-2 backdrop-blur-sm min-w-[140px] shadow-lg",
        "transition-all duration-200",
        colorClass,
        selected && "ring-2 ring-amber-400/70 shadow-amber-400/20"
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !border-2 !border-amber-400 !bg-[#0D0D14]"
      />
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <div>
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            {nodeType}
          </div>
          <div className="text-sm font-semibold text-gray-100">
            {d.label || nodeType.charAt(0).toUpperCase() + nodeType.slice(1)}
          </div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !border-2 !border-amber-400 !bg-[#0D0D14]"
      />
    </div>
  );
});
