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
  resetAt: string | null;

  setPlan: (plan: PlanTier) => void;
  incrementUsage: (files: number) => void;
  resetUsage: () => void;
  checkServerLimit: (limitType: string) => Promise<{ allowed: boolean; limit: number; resetAt: string | null }>;
  syncPlanFromServer: () => Promise<void>;
}

function generateSessionId(): string {
  return crypto.randomUUID();
}

const SYNC_CHANNEL = "image-pipeline-sync";

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => {
      const bc = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(SYNC_CHANNEL) : null;
      if (bc) {
        bc.onmessage = (event) => {
          const msg = event.data as { type: string; plan?: PlanTier; usage?: { filesProcessed: number; batchesProcessed: number }; resetAt?: string | null };
          if (msg.type === "plan-update" && msg.plan) set({ plan: msg.plan });
          if (msg.type === "usage-update" && msg.usage) set({ usage: msg.usage, resetAt: msg.resetAt ?? null });
        };
      }

      return {
        plan: "free",
        sessionId: generateSessionId(),
        proExpiresAt: null,
        usage: { filesProcessed: 0, batchesProcessed: 0 },
        resetAt: null,

        setPlan: (plan) => {
          set({ plan });
          bc?.postMessage({ type: "plan-update", plan });
        },

        incrementUsage: (files) => {
          set((s) => {
            const newUsage = {
              filesProcessed: s.usage.filesProcessed + files,
              batchesProcessed: s.usage.batchesProcessed + 1,
            };
            bc?.postMessage({ type: "usage-update", usage: newUsage, resetAt: s.resetAt });
            return { usage: newUsage };
          });
        },

        resetUsage: () => set({ usage: { filesProcessed: 0, batchesProcessed: 0 } }),

        checkServerLimit: async (limitType) => {
          const { sessionId } = get();
          try {
            const result = await edgeClient.checkLimit(sessionId, limitType);
            const newResetAt = result.resetAt ?? null;
            set({ resetAt: newResetAt });
            bc?.postMessage({ type: "usage-update", usage: get().usage, resetAt: newResetAt });
            return {
              allowed: result.allowed,
              limit: result.limit,
              resetAt: newResetAt,
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
              bc?.postMessage({ type: "plan-update", plan: result.tier });
            }
          } catch {
            /* fail-open: keep current plan */
          }
        },
      };
    },
    {
      name: "image-pipeline-user",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        plan: state.plan,
        sessionId: state.sessionId,
        proExpiresAt: state.proExpiresAt,
        resetAt: state.resetAt,
      }),
    }
  )
);
