export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: Record<string, unknown> };
  meta: { requestId: string; timestamp: string };
}

export interface SessionData {
  sessionId: string;
  tier: "free" | "pro" | "team";
  createdAt: string;
  lastActive: string;
  isFirstVisit?: boolean;
  totalFilesProcessed?: number;
  totalPipelinesCompleted?: number;
}

export type LimitType = "files" | "nodes" | "batches" | "format";
