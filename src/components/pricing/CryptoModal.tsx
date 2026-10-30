import { useState, useRef, useEffect, useCallback } from "react";
import { X, Copy, Check, Loader2, ExternalLink, Mail, Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import QRCode from "qrcode";
import { useVerifyTrc20 } from "../../hooks/useVerifyTrc20";
import { useUserStore } from "../../stores/user.store";
import { trackEvent, Events } from "../../lib/analytics";

const FALLBACK_ADDRESS = "THuqvL1xc44ksPzULvHzWTNVCp8JCruKS9";

const PRICES: Record<string, { label: string; usdt: number; months: number }> = {
  pro: { label: "Pro", usdt: 10, months: 1200 },
  lifetime: { label: "Lifetime", usdt: 30, months: 1200 },
};

type TgPhase = "idle" | "creating" | "waiting" | "timeout" | "expired" | "error" | "paid";

export function CryptoModal({
  tier,
  onClose,
}: {
  tier: "pro" | "lifetime";
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const price = PRICES[tier];
  const sessionId = useUserStore((s) => s.sessionId);
  const syncPlanFromServer = useUserStore((s) => s.syncPlanFromServer);
  const [usdtAddress, setUsdtAddress] = useState(FALLBACK_ADDRESS);
  const { status, message, startChecking, reset } = useVerifyTrc20(usdtAddress, price.usdt);
  const [txInput, setTxInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [receiptStatus, setReceiptStatus] = useState<"idle" | "sending" | "sent" | "skipped" | "failed">("idle");
  const [copied, setCopied] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [qrsrc, setQrsrc] = useState("");
  const [telegramPay, setTelegramPay] = useState(false);
  const [tg, setTg] = useState<{ phase: TgPhase; url?: string; hash?: string; error?: string }>({ phase: "idle" });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/crypto/config")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d?.data?.usdtAddress) setUsdtAddress(d.data.usdtAddress);
        setTelegramPay(!!d?.data?.telegramPay);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(`usdt:${usdtAddress}`, {
      width: 176,
      margin: 1,
      color: { dark: "#F59E0B", light: "#0D0D14" },
    })
      .then((url) => { if (!cancelled) setQrsrc(url); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [usdtAddress]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        reset();
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose, reset]);

  const sendReceipt = useCallback(async (email: string) => {
    setReceiptStatus("sending");
    try {
      const res = await fetch("/api/crypto/receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          plan: tier,
          txId: txInput.trim() || `cryptobot:${tg.hash || ""}`,
          sessionId,
        }),
      });
      const data = await res.json() as { success: boolean; data?: { sent: boolean } };
      if (data.success && data.data?.sent) {
        setReceiptStatus("sent");
      } else {
        setReceiptStatus("failed");
      }
    } catch {
      setReceiptStatus("failed");
    }
  }, [tier, txInput, sessionId, tg.hash]);

  const checkInvoice = useCallback(async (hash: string) => {
    try {
      const res = await fetch(`/api/crypto/telegram-pay?hash=${encodeURIComponent(hash)}&sessionId=${sessionId}`);
      const data = await res.json() as { success: boolean; data?: { paid?: boolean; plan?: string; status?: string }; error?: { code?: string; message?: string } };
      const d = data.data;
      if (!data.success || !d) {
        setTg((s) => ({ ...s, error: data.error ? `${data.error.code}: ${data.error.message}` : "status check failed" }));
        return;
      }
      setTg((s) => ({ ...s, error: undefined }));
      if (d.paid) {
        setTg((s) => ({ ...s, phase: "paid" }));
      } else if (d.status === "expired") {
        setTg((s) => (s.phase === "waiting" || s.phase === "timeout" ? { ...s, phase: "expired" } : s));
      }
    } catch {
      // transient network error — polling continues
    }
  }, [sessionId]);

  const createInvoice = useCallback(async () => {
    setTg({ phase: "creating" });
    try {
      // Resume this session's latest invoice instead of creating a duplicate
      const last = await fetch(`/api/crypto/telegram-pay?sessionId=${sessionId}`)
        .then((r) => r.json())
        .catch(() => null) as { success?: boolean; data?: { paid?: boolean; status?: string; hash?: string; url?: string } } | null;
      const ld = last?.data;
      if (ld?.paid) {
        setTg({ phase: "paid" });
        return;
      }
      if (ld?.status === "active" && ld.hash && ld.url) {
        setTg({ phase: "waiting", url: ld.url, hash: ld.hash });
        return;
      }

      const res = await fetch("/api/crypto/telegram-pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, sessionId }),
      });
      const data = await res.json() as { success: boolean; data?: { configured?: boolean; url?: string; hash?: string; paid?: boolean; plan?: string } };
      const d = data.data;
      if (!data.success || !d?.hash) {
        setTg({ phase: "error" });
        return;
      }
      if (d.paid) {
        setTg({ phase: "paid" });
        return;
      }
      if (!d.url) {
        setTg({ phase: "error" });
        return;
      }
      window.open(d.url, "_blank", "noopener,noreferrer");
      setTg({ phase: "waiting", url: d.url, hash: d.hash });
    } catch {
      setTg({ phase: "error" });
    }
  }, [tier, sessionId]);

  useEffect(() => {
    if (tg.phase !== "waiting" || !tg.hash) return;
    const hash = tg.hash;
    void checkInvoice(hash);
    const iv = setInterval(() => void checkInvoice(hash), 5000);
    const to = setTimeout(() => {
      setTg((s) => (s.phase === "waiting" ? { ...s, phase: "timeout" } : s));
    }, 10 * 60 * 1000);
    return () => { clearInterval(iv); clearTimeout(to); };
  }, [tg.phase, tg.hash, checkInvoice]);

  useEffect(() => {
    if (status === "verified" || tg.phase === "paid") {
      syncPlanFromServer();
      trackEvent(Events.PURCHASE_COMPLETED, { plan: tier, price: price.usdt, method: tg.phase === "paid" ? "cryptobot" : "trc20" });
      if (emailInput && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)) {
        sendReceipt(emailInput);
      } else {
        setReceiptStatus("skipped");
      }
    }
  }, [status, tg.phase, syncPlanFromServer, tier, price.usdt, emailInput, sendReceipt]);

  const checkActivation = useCallback(async () => {
    try {
      const res = await fetch(`/api/crypto/check?sessionId=${sessionId}`);
      const data = await res.json() as { success: boolean; data?: { activated: boolean; plan?: string; tier?: string } };
      if (data.success && data.data?.activated) {
        syncPlanFromServer();
        reset();
      } else {
        setTxInput("");
        reset();
      }
    } catch {
      reset();
    }
  }, [sessionId, syncPlanFromServer, reset]);

  const handleCopy = () => {
    navigator.clipboard.writeText(usdtAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = () => {
    if (txInput.trim()) {
      startChecking(sessionId, txInput.trim());
    }
  };

  const txFlowBusy = status === "checking" || status === "verified" || tg.phase === "waiting" || tg.phase === "paid";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div
        ref={modalRef}
        className="w-full max-w-md bg-[#1A1A24] border border-white/10 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-100">{t("cryptoModal.title")}</h2>
          <button onClick={() => { reset(); onClose(); }} className="text-gray-500 hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-[#0D0D14] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">{t("cryptoModal.amount")}</span>
              <span className="text-sm font-semibold text-amber-400">
                {price.usdt} USDT (TRC-20)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">{t("cryptoModal.plan")}</span>
              <span className="text-sm font-medium text-gray-200">{price.label}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">{t("cryptoModal.network")}</span>
              <span className="text-sm font-medium text-gray-200">TRC-20 (Tron)</span>
            </div>
          </div>

          {telegramPay && (
          <div className="bg-[#0D0D14] rounded-xl p-4 space-y-2">
            <p className="text-xs text-gray-500">{t("cryptoModal.telegram.desc")}</p>
            {(tg.phase === "idle" || tg.phase === "creating" || tg.phase === "error" || tg.phase === "expired") && (
              <div className="space-y-2">
                {(tg.phase === "error" || tg.phase === "expired") && (
                  <p className="text-xs text-red-400">
                    {tg.phase === "expired" ? t("cryptoModal.telegram.expired") : t("cryptoModal.telegram.error")}
                  </p>
                )}
                <button
                  onClick={createInvoice}
                  disabled={tg.phase === "creating"}
                  className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-gray-200 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                >
                  {tg.phase === "creating" && <Loader2 className="w-4 h-4 animate-spin" />}
                  <Send className="w-4 h-4" />
                  {t("cryptoModal.telegram.create")}
                </button>
              </div>
            )}
            {(tg.phase === "waiting" || tg.phase === "timeout") && tg.url && (
              <div className="space-y-2">
                <a
                  href={tg.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  {t("cryptoModal.telegram.open")}
                </a>
                {tg.phase === "waiting" ? (
                  <p className="text-xs text-gray-500 flex items-center justify-center gap-1.5">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {t("cryptoModal.telegram.waiting")}
                  </p>
                ) : (
                  <button
                    onClick={() => tg.hash && checkInvoice(tg.hash)}
                    className="w-full bg-white/5 hover:bg-white/10 text-gray-200 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                  >
                    {t("cryptoModal.telegram.check")}
                  </button>
                )}
                {tg.error && (
                  <p className="text-xs text-amber-500 text-center font-mono">{tg.error}</p>
                )}
              </div>
            )}
          </div>
          )}

          <div className="bg-[#0D0D14] rounded-xl p-4">
            <label className="text-xs text-gray-500 mb-1 block">{t("cryptoModal.sendTo")}</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs text-amber-300 font-mono truncate bg-white/5 px-2 py-1.5 rounded-lg">
                {usdtAddress}
              </code>
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {qrsrc && (
            <div className="bg-[#0D0D14] rounded-xl p-4 text-center">
              <img src={qrsrc} alt={t("cryptoModal.qrCode")} className="w-44 h-44 mx-auto rounded-lg" />
            </div>
          )}

          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t("cryptoModal.txId")}</label>
            <input
              ref={inputRef}
              type="text"
              value={txInput}
              onChange={(e) => setTxInput(e.target.value)}
              placeholder={t("cryptoModal.txIdPlaceholder")}
              className="w-full bg-[#0D0D14] border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-200 font-mono placeholder:text-gray-600 focus:outline-none focus:border-amber-500/50"
              disabled={txFlowBusy}
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">
              {t("cryptoModal.emailReceipt")} <span className="text-gray-600">{t("cryptoModal.emailOptional")}</span>
            </label>
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder={t("cryptoModal.emailPlaceholder")}
              className="w-full bg-[#0D0D14] border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-amber-500/50"
              disabled={txFlowBusy}
            />
          </div>

          {status === "idle" && tg.phase !== "paid" && (
            <button
              onClick={handleVerify}
              disabled={!txInput.trim()}
              className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/30 disabled:text-gray-500 text-black px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              {t("cryptoModal.verify")}
            </button>
          )}

          {status === "checking" && (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-sm text-amber-400 py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("cryptoModal.checking")}
              </div>
              <p className="text-[10px] text-gray-500 text-center">
                {t("cryptoModal.checkingDesc")}
              </p>
            </div>
          )}

          {(status === "not-found" || status === "error") && (
            <div className="space-y-3">
              <div className={`text-sm text-center py-2 ${status === "error" ? "text-red-400" : "text-gray-400"}`}>
                {status === "not-found" ? t("cryptoModal.notFound") : message}
              </div>
              <button
                onClick={handleVerify}
                className="w-full bg-white/5 hover:bg-white/10 text-gray-200 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              >
                {t("cryptoModal.tryAgain")}
              </button>
            </div>
          )}

          {status === "timeout" && (
            <div className="space-y-3">
              <div className="text-sm text-gray-400 text-center py-2">
                {t("cryptoModal.timeout")}
              </div>
              <button
                onClick={checkActivation}
                className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-black px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                {t("cryptoModal.checkActivation")}
              </button>
              <p className="text-[10px] text-gray-600 text-center">
                {t("cryptoModal.comeBackLater")}
              </p>
            </div>
          )}

          {(status === "verified" || tg.phase === "paid") && (
            <div className="space-y-3">
              <div className="text-sm text-green-400 text-center py-2 font-medium">
                {t("cryptoModal.verified", { plan: price.label })}
              </div>
              {receiptStatus === "sending" && (
                <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {t("cryptoModal.receiptSending")}
                </div>
              )}
              {receiptStatus === "sent" && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
                  <Mail className="w-3 h-3" />
                  {t("cryptoModal.receiptSent", { email: emailInput })}
                </div>
              )}
              {receiptStatus === "skipped" && (
                <div className="text-xs text-gray-500 text-center">
                  {t("cryptoModal.receiptSkipped")}
                </div>
              )}
              {receiptStatus === "failed" && (
                <div className="text-xs text-amber-500 text-center">
                  {t("cryptoModal.receiptFailed")}
                </div>
              )}
            </div>
          )}

          <p className="text-[10px] text-gray-600 text-center">
            {t("cryptoModal.wrongAmount")}
          </p>
        </div>
      </div>
    </div>
  );
}
