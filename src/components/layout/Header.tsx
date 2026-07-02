import { Play, Ban, Save, Undo2, Redo2, Menu, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useFilesStore } from "../../stores/files.store";
import { usePipelineStore } from "../../stores/pipeline.store";
import { useSavedPipelinesStore } from "../../stores/saved-pipelines.store";
import { useUIStore } from "../../stores/ui.store";
import { useUserStore } from "../../stores/user.store";
import { UsageIndicator } from "./UsageIndicator";
import { cn } from "../../lib";

export function Header({ onProcess }: { onProcess: () => void }) {
  const navigate = useNavigate();
  const files = useFilesStore((s) => s.files);
  const nodes = usePipelineStore((s) => s.nodes);
  const isProcessing = useUIStore((s) => s.isProcessing);
  const plan = useUserStore((s) => s.plan);

  const edges = usePipelineStore((s) => s.edges);
  const past = usePipelineStore((s) => s.past);
  const future = usePipelineStore((s) => s.future);
  const undo = usePipelineStore((s) => s.undo);
  const redo = usePipelineStore((s) => s.redo);
  const savePipeline = useSavedPipelinesStore((s) => s.save);
  const mobileSidebarOpen = useUIStore((s) => s.mobileSidebarOpen);
  const setMobileSidebar = useUIStore((s) => s.setMobileSidebar);

  const hasActiveFiles = files.some((f) => f.status !== "blocked");
  const allBlocked = files.length > 0 && !hasActiveFiles;
  const canProcess = hasActiveFiles && nodes.length > 0 && !isProcessing;
  const canSave = nodes.length > 0;

  const handleSave = () => {
    const name = window.prompt("Pipeline name", `Pipeline ${new Date().toLocaleString()}`);
    if (name) savePipeline(name, null, nodes, edges);
  };

  return (
    <header className="h-14 flex items-center justify-between px-4 bg-[#111118] border-b border-white/5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileSidebar(!mobileSidebarOpen)}
          className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-white/5"
          title="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Image Pipeline" className="w-10 h-10" />
          <span className="text-sm font-bold text-gray-100">Image Pipeline</span>
        </div>
        <div className="hidden lg:flex items-center gap-1 ml-6">
          <button
            onClick={undo}
            disabled={past.length === 0}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              past.length > 0 ? "text-gray-400 hover:text-gray-200 hover:bg-white/5" : "text-gray-700 cursor-not-allowed"
            )}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={future.length === 0}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              future.length > 0 ? "text-gray-400 hover:text-gray-200 hover:bg-white/5" : "text-gray-700 cursor-not-allowed"
            )}
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={!canSave}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
            canSave
              ? "bg-white/10 hover:bg-white/15 text-gray-200"
              : "text-gray-600 cursor-not-allowed"
          )}
        >
          <Save className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Save</span>
        </button>
        <span
          className={cn(
            "text-xs font-medium px-2 py-1 rounded-full",
            plan === "free"
              ? "bg-gray-800 text-gray-400"
              : "bg-amber-500/20 text-amber-400"
          )}
        >
          {plan === "free" ? "Free" : "Pro"}
        </span>
        {plan === "free" && <UsageIndicator compact />}

        <button
          onClick={() => navigate("/faq")}
          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
          title="FAQ"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        <button
          data-onboarding="process-btn"
          onClick={onProcess}
          disabled={!canProcess}
          title={allBlocked ? "All files exceed the size limit" : undefined}
          className={cn(
            "flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
            canProcess
              ? "bg-amber-500 hover:bg-amber-400 text-black"
              : "bg-white/5 text-gray-500 cursor-not-allowed"
          )}
        >
          {allBlocked ? (
            <Ban className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" fill="currentColor" />
          )}
          <span className="hidden sm:inline">Process</span>
        </button>
      </div>
    </header>
  );
}
