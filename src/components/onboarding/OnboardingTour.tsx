import { useEffect, useState } from "react";
import { useUIStore } from "../../stores/ui.store";

const STEPS = [
  {
    title: "Welcome to Image Pipeline",
    body: "Build custom image processing pipelines visually. Each node performs one operation — connect them to create powerful workflows.",
    action: "Get Started",
  },
  {
    title: "Upload Files",
    body: 'Start by uploading your images. Drag & drop or click to select. Supported formats: JPEG, PNG, WebP, AVIF, GIF, BMP, TIFF.',
    target: "files-tab",
    action: "Next",
  },
  {
    title: "Add Nodes",
    body: 'Switch to the Nodes tab to see all available operations. Click a node to add it to the canvas, or drag it in.',
    target: "nodes-tab",
    action: "Next",
  },
  {
    title: "Build Your Pipeline",
    body: "Connect nodes by dragging from one handle to another. Disconnected nodes are skipped during processing.",
    target: "canvas",
    action: "Next",
  },
  {
    title: "Configure Settings",
    body: "Select any node on the canvas to open its settings panel on the right. Each node type has its own set of controls — tweak them to fine-tune your output.",
    action: "Next",
  },
  {
    title: "Process Images",
    body: "Once your pipeline is ready, hit the Process button in the header. All images run through the same pipeline.",
    target: "process-btn",
    action: "Next",
  },
  {
    title: "All Set!",
    body: "You're ready to start building. Experiment, combine nodes, and process your images — all client-side, nothing leaves your device.",
    action: "Finish",
  },
];

function getTargetRect(targetId: string): DOMRect | null {
  const el = document.querySelector(`[data-onboarding="${targetId}"]`);
  if (!el) return null;
  return el.getBoundingClientRect();
}

function TooltipCard({
  step,
  total,
  onNext,
  onSkip,
  onPrev,
}: {
  step: number;
  total: number;
  onNext: () => void;
  onSkip: () => void;
  onPrev: () => void;
}) {
  const s = STEPS[step - 1];
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (s.target) {
      const rect = getTargetRect(s.target);
      if (rect) {
        const isLeftSide = rect.left < window.innerWidth / 3;
        if (isLeftSide) {
          setPos({
            top: Math.max(16, rect.top),
            left: Math.min(rect.right + 16, window.innerWidth - 336),
          });
        } else {
          setPos({
            top: Math.max(16, rect.bottom + 12),
            left: Math.max(16, Math.min(rect.left + rect.width / 2 - 160, window.innerWidth - 352)),
          });
        }
      }
    }
  }, [s.target]);

  const style = s.target
    ? { position: "fixed" as const, top: pos.top, left: pos.left, width: 320 }
    : { position: "fixed" as const, top: "50%" as const, left: "50%" as const, transform: "translate(-50%, -50%)", width: 360 };

  return (
    <div
      className="rounded-xl border border-white/10 bg-[#1A1A24] shadow-2xl p-5 z-50"
      style={style}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] font-medium text-amber-400 uppercase tracking-wider">
          Step {step} of {total}
        </span>
      </div>
      <h3 className="text-base font-semibold text-gray-100 mb-2">{s.title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed mb-5">{s.body}</p>
      <div className="flex items-center justify-between">
        <button onClick={onSkip} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
          Skip tour
        </button>
        <div className="flex items-center gap-2">
          {step > 1 && (
            <button
              onClick={onPrev}
              className="px-3 py-1.5 text-xs font-medium text-gray-300 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={onNext}
            className="px-4 py-1.5 text-xs font-medium text-black bg-amber-500 rounded-lg hover:bg-amber-400 transition-colors"
          >
            {s.action}
          </button>
        </div>
      </div>
    </div>
  );
}

function HighlightBox({ targetId }: { targetId: string }) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const r = getTargetRect(targetId);
    if (r) setRect(r);
  }, [targetId]);

  if (!rect) return null;

  return (
    <div
      className="fixed z-40 rounded-lg border-2 border-amber-400/60 pointer-events-none"
      style={{
        top: rect.top - 4,
        left: rect.left - 4,
        width: rect.width + 8,
        height: rect.height + 8,
        boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)",
      }}
    />
  );
}

export function OnboardingTour() {
  const step = useUIStore((s) => s.onboardingStep);
  const nextStep = useUIStore((s) => s.nextOnboardingStep);
  const prevStep = useUIStore((s) => s.prevOnboardingStep);
  const skip = useUIStore((s) => s.skipOnboarding);
  const setLeftSidebar = useUIStore((s) => s.setLeftSidebar);

  useEffect(() => {
    if (step === 2) setLeftSidebar("files");
    else if (step === 3) setLeftSidebar("palette");
  }, [step, setLeftSidebar]);

  if (step === null) return null;

  const s = STEPS[step - 1];

  return (
    <>
      {step > 1 && step < 7 && s.target && <HighlightBox targetId={s.target} />}
      <TooltipCard
        step={step}
        total={STEPS.length}
        onNext={() => {
          if (step === STEPS.length) {
            useUIStore.getState().completeOnboarding();
          } else {
            nextStep();
          }
        }}
        onSkip={skip}
        onPrev={() => prevStep()}
      />
    </>
  );
}
