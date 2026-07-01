import { useState, useRef, useEffect } from "react";
import { X, Copy, Check, Loader2 } from "lucide-react";
import { useVerifyTrc20 } from "../../hooks/useVerifyTrc20";
import { useUserStore } from "../../stores/user.store";

const USDT_ADDRESS = "TPenBbjw2BE1zBMot2kKrNuGgYdbPvQwDr";

const PRICES: Record<string, { label: string; usdt: number; months: number }> = {
  pro: { label: "Pro Monthly", usdt: 10, months: 1 },
  lifetime: { label: "Lifetime", usdt: 30, months: 1200 },
};

export function CryptoModal({
  tier,
  onClose,
}: {
  tier: "pro" | "lifetime";
  onClose: () => void;
}) {
  const price = PRICES[tier];
  const { status, startChecking } = useVerifyTrc20(USDT_ADDRESS, price.usdt);
  const activatePro = useUserStore((s) => s.activatePro);
  const [copied, setCopied] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const handleCopy = () => {
    navigator.clipboard.writeText(USDT_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async () => {
    startChecking();
  };

  useEffect(() => {
    if (status === "verified") {
      activatePro(price.months);
    }
  }, [status, activatePro, price.months]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div
        ref={modalRef}
        className="w-full max-w-md bg-[#1A1A24] border border-white/10 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-100">Pay with Crypto</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-[#0D0D14] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Amount</span>
              <span className="text-sm font-semibold text-amber-400">
                {price.usdt} USDT (TRC-20)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Plan</span>
              <span className="text-sm font-medium text-gray-200">{price.label}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Network</span>
              <span className="text-sm font-medium text-gray-200">TRC-20 (Tron)</span>
            </div>
          </div>

          <div className="bg-[#0D0D14] rounded-xl p-4">
            <label className="text-xs text-gray-500 mb-1 block">Send to address</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs text-amber-300 font-mono truncate bg-white/5 px-2 py-1.5 rounded-lg">
                {USDT_ADDRESS}
              </code>
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="bg-[#0D0D14] rounded-xl p-4 text-center">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=usdt:${USDT_ADDRESS}&bgcolor=0D0D14&color=F59E0B`}
              alt="QR Code"
              className="w-44 h-44 mx-auto rounded-lg"
            />
          </div>

          {status === "idle" && (
            <button
              onClick={handleVerify}
              className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-black px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              I've Sent — Verify
            </button>
          )}

          {status === "checking" && (
            <div className="flex items-center justify-center gap-2 text-sm text-amber-400 py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Checking for transaction...
            </div>
          )}

          {status === "not-found" && (
            <div className="text-sm text-gray-400 text-center py-2">
              No transaction found yet. Make sure you sent <strong>{price.usdt} USDT</strong> to the correct address on <strong>TRC-20</strong> network, then try again.
            </div>
          )}

          {status === "verified" && (
            <div className="text-sm text-green-400 text-center py-2 font-medium">
              Payment confirmed! Pro is now active. You can close this window.
            </div>
          )}

          <p className="text-[10px] text-gray-600 text-center">
            Sent the wrong amount or network? Contact us with your TxID to resolve it.
          </p>
        </div>
      </div>
    </div>
  );
}
