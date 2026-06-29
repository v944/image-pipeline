import { Play, Sparkles } from "lucide-react";
import { useFilesStore } from "../../stores/files.store";
import { usePipelineStore } from "../../stores/pipeline.store";
import { useUIStore } from "../../stores/ui.store";
import { useUserStore } from "../../stores/user.store";
import { cn } from "../../lib";

export function Header({ onProcess }: { onProcess: () => void }) {
  const files = useFilesStore((s) => s.files);
  const nodes = usePipelineStore((s) => s.nodes);
  const isProcessing = useUIStore((s) => s.isProcessing);
  const plan = useUserStore((s) => s.plan);

  const canProcess = files.length > 0 && nodes.length > 0 && !isProcessing;

  return (
    <header className="h-14 flex items-center justify-between px-4 bg-[#111118] border-b border-white/5">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span className="text-sm font-bold text-gray-100">Image Pipeline</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
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

        <button
          onClick={onProcess}
          disabled={!canProcess}
          className={cn(
            "flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
            canProcess
              ? "bg-amber-500 hover:bg-amber-400 text-black"
              : "bg-white/5 text-gray-500 cursor-not-allowed"
          )}
        >
          <Play className="w-4 h-4" fill="currentColor" />
          Process
        </button>
      </div>
    </header>
  );
}
