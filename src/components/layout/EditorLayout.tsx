import { useEffect, lazy, Suspense } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { cn } from "../../lib";
import { Header } from "./Header";
import { LeftSidebar } from "./Sidebar";
import { ProcessingModal } from "../processing/ProcessingModal";
import { useUIStore } from "../../stores/ui.store";
import { usePipelineStore } from "../../stores/pipeline.store";
import { useUserStore } from "../../stores/user.store";
import { NodeSettings } from "../pipeline/NodeSettings";
import { OnboardingTour } from "../onboarding/OnboardingTour";

const FlowEditor = lazy(() => import("../pipeline/FlowEditor").then((m) => ({ default: m.FlowEditor })));

function EditorSkeleton() {
  return (
    <div className="flex-1 flex items-center justify-center bg-[#0D0D14]">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-white/5 mx-auto mb-4 animate-pulse" />
        <div className="h-3 w-48 bg-white/5 rounded mx-auto mb-2 animate-pulse" />
        <div className="h-3 w-32 bg-white/5 rounded mx-auto animate-pulse" />
      </div>
    </div>
  );
}

function EditorContent() {
  const rightSidebar = useUIStore((s) => s.rightSidebar);
  const setRightSidebar = useUIStore((s) => s.setRightSidebar);
  const selectedNodeId = usePipelineStore((s) => s.selectedNodeId);
  const onboardingCompleted = useUIStore((s) => s.onboardingCompleted);
  const startOnboarding = useUIStore((s) => s.startOnboarding);

  useEffect(() => {
    if (!onboardingCompleted) startOnboarding();
  }, []);

  useEffect(() => {
    const unsub = usePipelineStore.subscribe((state) => {
      if (state.selectedNodeId) {
        setRightSidebar("settings");
      }
    });
    return unsub;
  }, [setRightSidebar]);

  return (
    <div className="flex flex-1 overflow-hidden">
      <LeftSidebar />
      <main className="flex-1 relative">
        <Suspense fallback={<EditorSkeleton />}>
          <FlowEditor />
        </Suspense>
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
    useUserStore.getState().syncPlanFromServer();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        if (e.shiftKey) {
          e.preventDefault();
          usePipelineStore.getState().redo();
        } else {
          e.preventDefault();
          usePipelineStore.getState().undo();
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        useUIStore.getState().setRightSidebar("closed");
        window.dispatchEvent(new CustomEvent("start-processing"));
        return;
      }

      if ((e.key === "Delete" || e.key === "Backspace") && !isInput) {
        const selectedId = usePipelineStore.getState().selectedNodeId;
        if (selectedId) {
          usePipelineStore.getState().removeNode(selectedId);
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
