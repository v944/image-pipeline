import { useReactFlow } from "@xyflow/react";
import { useTranslation } from "react-i18next";
import { usePipelineStore } from "../../stores/pipeline.store";
import type { NodeType } from "../../types";
import { trackEvent, Events } from "../../lib/analytics";

export function NodePalette() {
  const { t } = useTranslation();
  const addNode = usePipelineStore((s) => s.addNode);
  const nodes = usePipelineStore((s) => s.nodes);
  const reactFlow = useReactFlow();

  const PALETTE_ITEMS: { type: NodeType; icon: string; label: string; description: string }[] = [
    { type: "load", icon: "📂", label: t("nodePalette.load"), description: t("nodePalette.loadDesc") },
    { type: "resize", icon: "📐", label: t("nodePalette.resize"), description: t("nodePalette.resizeDesc") },
    { type: "crop", icon: "✂️", label: t("nodePalette.crop"), description: t("nodePalette.cropDesc") },
    { type: "compress", icon: "📦", label: t("nodePalette.compress"), description: t("nodePalette.compressDesc") },
    { type: "format", icon: "🔄", label: t("nodePalette.format"), description: t("nodePalette.formatDesc") },
    { type: "watermark", icon: "©", label: t("nodePalette.watermark"), description: t("nodePalette.watermarkDesc") },
    { type: "denoise", icon: "🧹", label: t("nodePalette.denoise"), description: t("nodePalette.denoiseDesc") },
    { type: "rename", icon: "✏️", label: t("nodePalette.rename"), description: t("nodePalette.renameDesc") },
    { type: "export", icon: "💾", label: t("nodePalette.export"), description: t("nodePalette.exportDesc") },
  ];

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
    trackEvent(Events.NODE_ADDED, { nodeType: type, method: "click" });
  };

  return (
    <div className="p-3 space-y-1.5">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-3">
        {t("sidebar.nodePalette")}
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
