import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface UIState {
  leftSidebar: "palette" | "files" | "saved";
  rightSidebar: "settings" | "info" | "closed";
  isProcessing: boolean;
  processingProgress: number;
  processingTotal: number;
  onboardingStep: number | null;
  onboardingCompleted: boolean;

  setLeftSidebar: (tab: UIState["leftSidebar"]) => void;
  setRightSidebar: (tab: UIState["rightSidebar"]) => void;
  setProcessing: (active: boolean) => void;
  setProgress: (current: number, total: number) => void;
  startOnboarding: () => void;
  nextOnboardingStep: () => void;
  skipOnboarding: () => void;
  completeOnboarding: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      leftSidebar: "palette",
      rightSidebar: "closed",
      isProcessing: false,
      processingProgress: 0,
      processingTotal: 0,
      onboardingStep: null,
      onboardingCompleted: false,

      setLeftSidebar: (tab) => set({ leftSidebar: tab }),
      setRightSidebar: (tab) => set({ rightSidebar: tab }),

      setProcessing: (active) =>
        set({ isProcessing: active, processingProgress: 0 }),

      setProgress: (current, total) =>
        set({ processingProgress: current, processingTotal: total }),

      startOnboarding: () => set({ onboardingStep: 1 }),
      nextOnboardingStep: () =>
        set((s) => {
          if (s.onboardingStep === null) return {};
          const next = s.onboardingStep + 1;
          return next > 7
            ? { onboardingStep: null, onboardingCompleted: true }
            : { onboardingStep: next };
        }),
      skipOnboarding: () =>
        set({ onboardingStep: null, onboardingCompleted: false }),
      completeOnboarding: () =>
        set({ onboardingStep: null, onboardingCompleted: true }),
    }),
    {
      name: "image-pipeline-ui",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        onboardingCompleted: state.onboardingCompleted,
      }),
    }
  )
);
