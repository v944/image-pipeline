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

  mobileSidebarOpen: boolean;
  setLeftSidebar: (tab: UIState["leftSidebar"]) => void;
  setRightSidebar: (tab: UIState["rightSidebar"]) => void;
  setMobileSidebar: (open: boolean) => void;
  setProcessing: (active: boolean) => void;
  setProgress: (current: number, total: number) => void;
  startOnboarding: () => void;
  nextOnboardingStep: () => void;
  prevOnboardingStep: () => void;
  skipOnboarding: () => void;
  completeOnboarding: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      leftSidebar: "palette",
      rightSidebar: "closed",
      mobileSidebarOpen: false,
      isProcessing: false,
      processingProgress: 0,
      processingTotal: 0,
      onboardingStep: null,
      onboardingCompleted: false,

      setLeftSidebar: (tab) => set({ leftSidebar: tab, mobileSidebarOpen: true }),
      setRightSidebar: (tab) => set({ rightSidebar: tab }),
      setMobileSidebar: (open) => set({ mobileSidebarOpen: open }),

      setProcessing: (active) =>
        set({ isProcessing: active, processingProgress: 0 }),

      setProgress: (current, total) =>
        set({ processingProgress: current, processingTotal: total }),

      startOnboarding: () => set({ onboardingStep: 1, leftSidebar: "files" }),
      nextOnboardingStep: () =>
        set((s) => {
          if (s.onboardingStep === null) return {};
          const next = s.onboardingStep + 1;
          return next > 7
            ? { onboardingStep: null, onboardingCompleted: true }
            : { onboardingStep: next };
        }),
      prevOnboardingStep: () =>
        set((s) => {
          if (s.onboardingStep === null || s.onboardingStep <= 1) return {};
          return { onboardingStep: s.onboardingStep - 1 };
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
