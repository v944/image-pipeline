import { useEffect } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { cn } from "../../lib";
import { Header } from "./Header";
import { LeftSidebar } from "./Sidebar";
import { FlowEditor } from "../pipeline/FlowEditor";
import { ProcessingModal } from "../processing/ProcessingModal";
import { useUIStore } from "../../stores/ui.store";
import { usePipelineStore } from "../../stores/pipeline.store";
import { NodeSettings } from "../pipeline/NodeSettings";
import { OnboardingTour } from "../onboarding/OnboardingTour";
import "../../index.css";

function EditorContent() {
  const rightSidebar = useUIStore((s) => s.rightSidebar);
  const setRightSidebar = useUIStore((s) => s.setRightSidebar);
  const selectedNodeId = usePipelineStore((s) => s.selectedNodeId);
  const onboardingCompleted = useUIStore((s) => s.onboardingCompleted);
  const startOnboarding = useUIStore((s) => s.startOnboarding);

  useEffect(() => {
    if (!onboardingCompleted) startOnboarding();
  }, []);

  usePipelineStore.subscribe((state) => {
    if (state.selectedNodeId) {
      setRightSidebar("settings");
    }
  });

  return (
    <div className="flex flex-1 overflow-hidden">
      <LeftSidebar />
      <main className="flex-1 relative">
        <FlowEditor />
      </main>
      {rightSidebar === "settings" && selectedNodeId && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setRightSidebar("closed")}
          />
          <aside
            className={cn(
              "flex flex-col bg-[#0D0D12] border-l border-white/5",
              "w-72 shrink-0",
              "lg:relative lg:translate-x-0",
              "fixed z-40 inset-y-0 right-0 transition-transform duration-200"
            )}
            data-onboarding="settings-panel"
          >
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
        </>
      )}
      <OnboardingTour />
    </div>
  );
}

export function EditorLayout() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        if (e.shiftKey) {
          e.preventDefault();
          usePipelineStore.getState().redo();
        } else {
          e.preventDefault();
          usePipelineStore.getState().undo();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-[#0D0D14] text-gray-100 overflow-hidden">
      <Header onProcess={() => {
        useUIStore.getState().setRightSidebar("closed");
        window.dispatchEvent(new CustomEvent("start-processing"));
      }} />
      <ReactFlowProvider>
        <EditorContent />
      </ReactFlowProvider>
      <ProcessingModal />
    </div>
  );
}
