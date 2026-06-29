import { Layers, FileImage, Bookmark } from "lucide-react";
import { useUIStore } from "../../stores/ui.store";
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

  return (
    <aside className="w-60 bg-[#0D0D12] border-r border-white/5 flex flex-col">
      <div className="flex border-b border-white/5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
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
        {activeTab === "saved" && (
          <div className="p-4 text-center text-gray-500 text-sm">
            Saved pipelines will appear here
          </div>
        )}
      </div>
    </aside>
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
