import { Layers, FileImage, Bookmark, Trash2, X } from "lucide-react";
import { useUIStore } from "../../stores/ui.store";
import { usePipelineStore } from "../../stores/pipeline.store";
import { useSavedPipelinesStore } from "../../stores/saved-pipelines.store";
import { NodePalette } from "../pipeline/NodePalette";
import { FileUploader } from "../files/FileUploader";
import { FileList } from "../files/FileList";
import { cn } from "../../lib";

const TABS = [
  { id: "palette" as const, icon: Layers, label: "Nodes" },
  { id: "files" as const, icon: FileImage, label: "Files" },
  { id: "saved" as const, icon: Bookmark, label: "Saved" },
];

export function LeftSidebar() {
  const activeTab = useUIStore((s) => s.leftSidebar);
  const setTab = useUIStore((s) => s.setLeftSidebar);
  const mobileOpen = useUIStore((s) => s.mobileSidebarOpen);
  const setMobileSidebar = useUIStore((s) => s.setMobileSidebar);

  return (
    <>
      <div
        className="fixed inset-0 z-30 bg-black/50 lg:hidden transition-opacity"
        style={{ opacity: mobileOpen ? 1 : 0, pointerEvents: mobileOpen ? "auto" : "none" }}
        onClick={() => setMobileSidebar(false)}
      />
      <aside
        className={cn(
          "w-60 bg-[#0D0D12] border-r border-white/5 flex flex-col shrink-0 transition-transform duration-200",
          "lg:relative lg:translate-x-0 fixed z-40 inset-y-0 left-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
      <div className="flex border-b border-white/5">
        <button
          onClick={() => setMobileSidebar(false)}
          className="lg:hidden px-2 text-gray-500 hover:text-gray-300"
        >
          <X className="w-4 h-4" />
        </button>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            data-onboarding={tab.id === "files" ? "files-tab" : tab.id === "palette" ? "nodes-tab" : undefined}
            onClick={() => setTab(tab.id)}
            className={cn(
              "flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
              activeTab === tab.id
                ? "text-amber-400 border-b-2 border-amber-400"
                : "text-gray-500 hover:text-gray-300"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {activeTab === "palette" && <NodePalette />}
        {activeTab === "files" && (
          <>
            <FileUploader />
            <FileList />
          </>
        )}
        {activeTab === "saved" && <SavedPipelines />}
      </div>
    </aside>
    </>
  );
}

function SavedPipelines() {
  const pipelines = useSavedPipelinesStore((s) => s.pipelines);
  const remove = useSavedPipelinesStore((s) => s.remove);
  const loadPipeline = usePipelineStore((s) => s.loadPipeline);

  if (pipelines.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        <div className="mb-2">No saved pipelines yet</div>
        <div className="text-xs text-gray-600">Build a pipeline and click Save in the header</div>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-2">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-3">
        Saved ({pipelines.length})
      </div>
      {pipelines.map((p) => (
        <div
          key={p.id}
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors group"
        >
          <button
            onClick={() => loadPipeline(p.nodes, p.edges)}
            className="flex-1 min-w-0 text-left"
            title="Load pipeline"
          >
            <div className="text-sm font-medium text-gray-200 truncate">{p.name}</div>
            <div className="text-[10px] text-gray-500">
              {p.nodes.length} nodes · {new Date(p.updatedAt).toLocaleDateString()}
            </div>
          </button>
          <button
            onClick={() => remove(p.id)}
            className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

export function RightSidebar() {
  const activeTab = useUIStore((s) => s.rightSidebar);
  const setTab = useUIStore((s) => s.setRightSidebar);

  if (activeTab === "closed") return null;

  return (
    <aside className="w-72 bg-[#0D0D12] border-l border-white/5 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {activeTab === "settings" ? "Settings" : "Info"}
        </span>
        <button
          onClick={() => setTab("closed")}
          className="text-gray-500 hover:text-gray-300 text-xs"
        >
          Close
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {activeTab === "settings" && (
          <div className="p-4 text-center text-gray-500 text-sm">
            Select a node to edit settings
          </div>
        )}
      </div>
    </aside>
  );
}
