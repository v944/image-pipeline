import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { PlanTier } from "../types";
import { edgeClient } from "../lib/edge-client";

interface UserState {
  plan: PlanTier;
  sessionId: string;
  proExpiresAt: string | null;
  usage: {
    filesProcessed: number;
    batchesProcessed: number;
  };

  setPlan: (plan: PlanTier) => void;
  incrementUsage: (files: number) => void;
  resetUsage: () => void;
  checkServerLimit: (limitType: string) => Promise<{ allowed: boolean; limit: number; resetAt: string | null }>;
  syncPlanFromServer: () => Promise<void>;
}

function generateSessionId(): string {
  return crypto.randomUUID();
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      plan: "free",
      sessionId: generateSessionId(),
      proExpiresAt: null,
      usage: { filesProcessed: 0, batchesProcessed: 0 },

      setPlan: (plan) => set({ plan }),

      incrementUsage: (files) =>
        set((s) => ({
          usage: {
            filesProcessed: s.usage.filesProcessed + files,
            batchesProcessed: s.usage.batchesProcessed + 1,
          },
        })),

      resetUsage: () => set({ usage: { filesProcessed: 0, batchesProcessed: 0 } }),

      checkServerLimit: async (limitType) => {
        const { sessionId } = get();
        try {
          const result = await edgeClient.checkLimit(sessionId, limitType);
          return {
            allowed: result.allowed,
            limit: result.limit,
            resetAt: result.resetAt,
          };
        } catch {
          return { allowed: true, limit: Infinity, resetAt: null };
        }
      },

      syncPlanFromServer: async () => {
        const { sessionId } = get();
        try {
          const result = await edgeClient.checkLimit(sessionId, "files");
          if (result.tier === "pro" || result.tier === "lifetime") {
            set({ plan: result.tier });
          }
        } catch {
          /* fail-open: keep current plan */
        }
      },
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
