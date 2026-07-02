import { useEffect, useState } from "react";
import { Zap, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useUserStore } from "../../stores/user.store";
import { FREE_LIMITS } from "../../types";

function formatTimeLeft(ms: number): string {
  if (ms <= 0) return "resetting...";
  const mins = Math.ceil(ms / 60000);
  if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  return `${mins}m`;
}

export function UsageIndicator({ compact }: { compact?: boolean }) {
  const { t } = useTranslation();
  const plan = useUserStore((s) => s.plan);
  const usage = useUserStore((s) => s.usage);
  const resetAt = useUserStore((s) => s.resetAt);
  const checkServerLimit = useUserStore((s) => s.checkServerLimit);

  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    if (plan !== "free") return;
    checkServerLimit("files");
  }, [plan, checkServerLimit]);

  useEffect(() => {
    if (!resetAt || plan !== "free") { setTimeLeft(null); return; }
    const update = () => setTimeLeft(formatTimeLeft(new Date(resetAt).getTime() - Date.now()));
    update();
    const id = setInterval(update, 10000);
    return () => clearInterval(id);
  }, [resetAt, plan]);

  if (plan !== "free") return null;

  const filesLimit = FREE_LIMITS.files;
  const filesUsed = usage.filesProcessed;
  const filesPct = Math.min(100, Math.round((filesUsed / filesLimit) * 100));

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-[11px]">
        <div className="flex items-center gap-1 text-gray-400">
          <Zap className="w-3 h-3 text-amber-400" />
          <span>{filesUsed}/{filesLimit}</span>
        </div>
        {timeLeft && (
          <div className="flex items-center gap-0.5 text-gray-500">
            <Clock className="w-2.5 h-2.5" />
            <span>{timeLeft}</span>
          </div>
        )}
        <div className="w-12 bg-white/5 rounded-full h-1">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${filesPct}%`,
              backgroundColor: filesPct >= 100 ? "#ef4444" : filesPct >= 80 ? "#f59e0b" : "#22c55e",
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 pb-1">
      <div className="bg-white/[0.03] rounded-lg px-3 py-2 border border-white/5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <Zap className="w-3 h-3 text-amber-400" />
            {t("usage.usage")}
          </div>
          <span className="text-[11px] text-gray-500">{t("usage.filesToday", { count: filesUsed, limit: filesLimit })}</span>
        </div>
        <div className="w-full bg-white/5 rounded-full h-1.5">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${filesPct}%`,
              backgroundColor: filesPct >= 100 ? "#ef4444" : filesPct >= 80 ? "#f59e0b" : "#22c55e",
            }}
          />
        </div>
        {timeLeft && (
          <div className="flex items-center gap-1 mt-1.5 text-[10px] text-gray-500">
            <Clock className="w-2.5 h-2.5" />
            {t("usage.resetsAt", { time: timeLeft })}
          </div>
        )}
      </div>
    </div>
  );
}
