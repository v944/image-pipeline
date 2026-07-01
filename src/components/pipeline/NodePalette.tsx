import { useReactFlow } from "@xyflow/react";
import { usePipelineStore } from "../../stores/pipeline.store";
import type { NodeType } from "../../types";

const PALETTE_ITEMS: { type: NodeType; icon: string; label: string; description: string }[] = [
  { type: "load", icon: "📂", label: "Load", description: "Load input images" },
  { type: "resize", icon: "📐", label: "Resize", description: "Change image dimensions" },
  { type: "crop", icon: "✂️", label: "Crop", description: "Crop to region" },
  { type: "compress", icon: "📦", label: "Compress", description: "Reduce file size" },
  { type: "format", icon: "🔄", label: "Format", description: "Convert format" },
  { type: "watermark", icon: "©", label: "Watermark", description: "Add text overlay" },
  { type: "denoise", icon: "🧹", label: "Denoise", description: "Reduce image noise" },
  { type: "rename", icon: "✏️", label: "Rename", description: "Rename output files" },
  { type: "export", icon: "💾", label: "Export", description: "Output settings" },
];

export function NodePalette() {
  const addNode = usePipelineStore((s) => s.addNode);
  const nodes = usePipelineStore((s) => s.nodes);
  const reactFlow = useReactFlow();

  const handleDragStart = (event: React.DragEvent, type: NodeType) => {
    event.dataTransfer.setData("application/reactflow", type);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleClick = (type: NodeType) => {
    const position = reactFlow.screenToFlowPosition({
      x: window.innerWidth / 2 - 70,
      y: window.innerHeight / 2,
    });
    addNode(type, position);
  };

  return (
    <div className="p-3 space-y-1.5">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-3">
        Nodes
      </div>
      {PALETTE_ITEMS.map((item) => {
        const count = nodes.filter((n) => n.type === item.type).length;
        return (
          <div
            key={item.type}
            draggable
            onDragStart={(e) => handleDragStart(e, item.type)}
            onClick={() => handleClick(item.type)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-grab active:cursor-grabbing
              hover:bg-white/5 transition-colors duration-150 group"
          >
            <span className="text-lg">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-200">{item.label}</div>
              <div className="text-xs text-gray-500 truncate">{item.description}</div>
            </div>
            {count > 0 && (
              <span className="text-xs text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">
                {count}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
