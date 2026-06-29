import { useCallback } from "react";
import { Header } from "./Header";
import { LeftSidebar } from "./Sidebar";
import { FlowEditor } from "../pipeline/FlowEditor";
import { ProcessingModal } from "../processing/ProcessingModal";
import { useUIStore } from "../../stores/ui.store";
import { usePipelineStore } from "../../stores/pipeline.store";
import { NodeSettings } from "../pipeline/NodeSettings";
import "../../index.css";

export function EditorLayout() {
  const rightSidebar = useUIStore((s) => s.rightSidebar);
  const setRightSidebar = useUIStore((s) => s.setRightSidebar);
  const selectedNodeId = usePipelineStore((s) => s.selectedNodeId);

  const handleProcess = useCallback(() => {
    setRightSidebar("closed");
    const event = new CustomEvent("start-processing");
    window.dispatchEvent(event);
  }, [setRightSidebar]);

  usePipelineStore.subscribe((state) => {
    if (state.selectedNodeId) {
      setRightSidebar("settings");
    }
  });

  return (
    <div className="h-screen flex flex-col bg-[#0D0D14] text-gray-100">
      <Header onProcess={handleProcess} />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <main className="flex-1 relative">
          <FlowEditor />
        </main>
        {rightSidebar === "settings" && selectedNodeId && (
          <aside className="w-72 bg-[#0D0D12] border-l border-white/5 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Settings
              </span>
              <button
                onClick={() => setRightSidebar("closed")}
                className="text-gray-500 hover:text-gray-300 text-xs"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <NodeSettings />
            </div>
          </aside>
        )}
      </div>
      <ProcessingModal />
    </div>
  );
}
