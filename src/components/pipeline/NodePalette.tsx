import { useState, useEffect } from "react";
import { useReactFlow } from "@xyflow/react";
import { useTranslation } from "react-i18next";
import { usePipelineStore } from "../../stores/pipeline.store";
import type { NodeType } from "../../types";
import { trackEvent, Events } from "../../lib/analytics";

interface PaletteItem {
  type: NodeType;
  icon: string;
  label: string;
  description: string;
  isNew?: boolean;
}

interface PaletteGroup {
  id: string;
  labelKey: string;
  border: string;
  headerBg: string;
  items: PaletteItem[];
}

const PALETTE_GROUPS: PaletteGroup[] = [
  {
    id: "input",
    labelKey: "paletteGroups.input",
    border: "border-blue-500/30",
    headerBg: "bg-blue-500/10",
    items: [
      { type: "load", icon: "📂", label: "load", description: "loadDesc" },
    ],
  },
  {
    id: "transform",
    labelKey: "paletteGroups.transform",
    border: "border-green-500/30",
    headerBg: "bg-green-500/10",
    items: [
      { type: "resize", icon: "📐", label: "resize", description: "resizeDesc" },
      { type: "crop", icon: "✂️", label: "crop", description: "cropDesc" },
      { type: "rotate", icon: "🔄", label: "rotate", description: "rotateDesc", isNew: true },
    ],
  },
  {
    id: "adjust",
    labelKey: "paletteGroups.adjust",
    border: "border-amber-500/30",
    headerBg: "bg-amber-500/10",
    items: [
      { type: "brightness", icon: "☀️", label: "brightness", description: "brightnessDesc" },
      { type: "contrast", icon: "◐", label: "contrast", description: "contrastDesc" },
      { type: "exposure", icon: "🔆", label: "exposure", description: "exposureDesc" },
      { type: "hsl", icon: "🌈", label: "hsl", description: "hslDesc", isNew: true },
      { type: "temperature", icon: "🌡️", label: "temperature", description: "temperatureDesc", isNew: true },
    ],
  },
  {
    id: "filter",
    labelKey: "paletteGroups.filter",
    border: "border-teal-500/30",
    headerBg: "bg-teal-500/10",
    items: [
      { type: "blur", icon: "🌫️", label: "blur", description: "blurDesc" },
      { type: "sharpen", icon: "🔪", label: "sharpen", description: "sharpenDesc" },
      { type: "grayscale", icon: "⚫", label: "grayscale", description: "grayscaleDesc", isNew: true },
      { type: "denoise", icon: "🧹", label: "denoise", description: "denoiseDesc" },
      { type: "watermark", icon: "©", label: "watermark", description: "watermarkDesc" },
    ],
  },
  {
    id: "style",
    labelKey: "paletteGroups.style",
    border: "border-purple-500/30",
    headerBg: "bg-purple-500/10",
    items: [
      { type: "emotion", icon: "🎭", label: "emotion", description: "emotionDesc" },
      { type: "format", icon: "🔄", label: "format", description: "formatDesc" },
    ],
  },
  {
    id: "output",
    labelKey: "paletteGroups.output",
    border: "border-red-500/30",
    headerBg: "bg-red-500/10",
    items: [
      { type: "compress", icon: "📦", label: "compress", description: "compressDesc" },
      { type: "rename", icon: "✏️", label: "rename", description: "renameDesc" },
      { type: "export", icon: "💾", label: "export", description: "exportDesc" },
    ],
  },
];

const DEFAULT_OPEN: Record<string, boolean> = { input: true };

const MAX_OPEN_GROUPS = 2;

const GROUPS_STORAGE_KEY = "ip-palette-groups";

function loadOpenGroups(): Record<string, boolean> {
  const base: Record<string, boolean> = { ...DEFAULT_OPEN };
  try {
    const raw = localStorage.getItem(GROUPS_STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Record<string, boolean>;
      PALETTE_GROUPS.forEach((g) => {
        if (typeof saved[g.id] === "boolean") base[g.id] = saved[g.id];
      });
    }
  } catch {
    // ignore corrupt storage
  }
  return base;
}

function normalizeSearch(s: string): string {
  return s.trim().toLowerCase();
}

export function NodePalette() {
  const { t } = useTranslation();
  const addNode = usePipelineStore((s) => s.addNode);
  const nodes = usePipelineStore((s) => s.nodes);
  const reactFlow = useReactFlow();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(loadOpenGroups);
  const [search, setSearch] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(openGroups));
    } catch {
      // ignore write errors (e.g. private mode)
    }
  }, [openGroups]);

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
    const store = usePipelineStore.getState();
    const added = store.nodes[store.nodes.length - 1];
    if (added && added.type === type) {
      store.updateNodeData(added.id, { label: t("nodePalette." + type) });
    }
    trackEvent(Events.NODE_ADDED, { nodeType: type, method: "click" });
  };

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      if (next[id]) {
        next[id] = false;
        return next;
      }
      const openIds = Object.keys(next).filter((k) => next[k]);
      if (openIds.length >= MAX_OPEN_GROUPS) {
        const oldest = openIds[0];
        next[oldest] = false;
      }
      next[id] = true;
      return next;
    });
  };

  return (
    <div className="p-3 space-y-1">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-3">
        {t("sidebar.nodePalette")}
      </div>
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t("paletteGroups.searchPlaceholder")}
        className="w-full mb-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-amber-400/50"
      />
      {PALETTE_GROUPS.map((group) => {
        const q = normalizeSearch(search);
        const filteredItems = q
          ? group.items.filter((item) => {
              const name = t(`nodePalette.${item.label}`).toLowerCase();
              const desc = t(`nodePalette.${item.description}`).toLowerCase();
              const groupName = t(group.labelKey).toLowerCase();
              return name.includes(q) || desc.includes(q) || groupName.includes(q);
            })
          : group.items;
        const groupNodes = filteredItems.filter((item) =>
          nodes.some((n) => n.type === item.type)
        ).length;
        const isOpen = !!openGroups[group.id];
        const visible = q ? filteredItems.length > 0 : true;
        if (!visible) return null;
        return (
          <div key={group.id} className={`rounded-xl border overflow-hidden ${group.border}`}>
            <button
              type="button"
              onClick={() => toggleGroup(group.id)}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-left
                ${group.headerBg} hover:bg-white/10 transition-colors duration-150 cursor-pointer group`}
            >
              <span className="flex-1 text-sm font-semibold text-gray-200">
                {t(group.labelKey)}
              </span>
              {groupNodes > 0 && (
                <span className="text-xs text-gray-400 bg-black/30 px-1.5 py-0.5 rounded">
                  {groupNodes}
                </span>
              )}
              <span
                className={`text-xs text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
              >
                ▼
              </span>
            </button>
            {(isOpen || q) && (
              <div className="bg-white/[0.03] border-t border-white/10 pt-1 pb-1 px-1 space-y-1">
                {filteredItems.map((item) => {
                  const count = nodes.filter((n) => n.type === item.type).length;
                  return (
                    <div
                      key={item.type}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item.type)}
                      onClick={() => handleClick(item.type)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-grab active:cursor-grabbing
                        hover:bg-white/10 transition-colors duration-150"
                    >
                      <span className="text-lg">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-gray-200">{t(`nodePalette.${item.label}`)}</span>
                          {item.isNew && (
                            <span className="text-[9px] font-bold text-amber-300 bg-amber-500/20 px-1 py-px rounded uppercase tracking-wide">
                              {t("common.new")}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 truncate">{t(`nodePalette.${item.description}`)}</div>
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
            )}
          </div>
        );
      })}
    </div>
  );
}
