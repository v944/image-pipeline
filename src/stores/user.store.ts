import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { PlanTier } from "../types";

interface UserState {
  plan: PlanTier;
  sessionId: string;
  proExpiresAt: string | null;
  usage: {
    filesProcessed: number;
    batchesProcessed: number;
  };

  setPlan: (plan: PlanTier) => void;
  activatePro: (durationMonths: number) => void;
  incrementUsage: (files: number) => void;
  resetUsage: () => void;
}

function generateSessionId(): string {
  return crypto.randomUUID();
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      plan: "free",
      sessionId: generateSessionId(),
      proExpiresAt: null,
      usage: { filesProcessed: 0, batchesProcessed: 0 },

      setPlan: (plan) => set({ plan }),

      activatePro: (durationMonths) => {
        const now = new Date();
        now.setMonth(now.getMonth() + durationMonths);
        set({ plan: "pro", proExpiresAt: now.toISOString() });
      },

      incrementUsage: (files) =>
        set((s) => ({
          usage: {
            filesProcessed: s.usage.filesProcessed + files,
            batchesProcessed: s.usage.batchesProcessed + 1,
          },
        })),

      resetUsage: () => set({ usage: { filesProcessed: 0, batchesProcessed: 0 } }),
    }),
    {
      name: "image-pipeline-user",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        plan: state.plan,
        sessionId: state.sessionId,
        proExpiresAt: state.proExpiresAt,
      }),
    }
  )
);
