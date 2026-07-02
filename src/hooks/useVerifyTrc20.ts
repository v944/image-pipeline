import { useState, useRef, useCallback, useEffect } from "react";

type VerifyStatus = "idle" | "checking" | "verified" | "not-found" | "error" | "timeout";

const VERIFY_TIMEOUT_MS = 120_000;
const POLL_INTERVAL_MS = 15_000;

export function useVerifyTrc20(_address: string, minAmountUsdt: number) {
  const [status, setStatus] = useState<VerifyStatus>("idle");
  const [message, setMessage] = useState("");
  const [txId, setTxId] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionIdRef = useRef("");

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const startChecking = useCallback((sessionId: string, transactionId: string) => {
    if (!transactionId || transactionId.length !== 64) {
      setStatus("error");
      setMessage("Please enter a valid transaction ID (64 hex characters)");
      return;
    }

    cleanup();

    setTxId(transactionId);
    sessionIdRef.current = sessionId;

    const verify = async () => {
      try {
        const res = await fetch("/api/crypto/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            txId: transactionId,
            expectedAmount: minAmountUsdt,
          }),
        });

        const data = await res.json() as { success: boolean; data?: { verified: boolean; message: string; plan?: string }; error?: { message: string } };

        if (!data.success || !data.data) {
          setStatus("error");
          setMessage(data.error?.message || "Verification failed. Try again.");
          cleanup();
          return;
        }

        if (data.data.verified) {
          setStatus("verified");
          setMessage(data.data.message || "Payment confirmed!");
          cleanup();
        } else {
          setStatus("not-found");
          setMessage(data.data.message || "Transaction not found. Check the TxID and try again.");
          cleanup();
        }
      } catch {
        setStatus("error");
        setMessage("Could not reach verification service. Check your connection and try again.");
        cleanup();
      }
    };

    setStatus("checking");
    verify();
    intervalRef.current = setInterval(verify, POLL_INTERVAL_MS);
    timeoutRef.current = setTimeout(() => {
      cleanup();
      setStatus("timeout");
      setMessage("Verification is taking longer than expected. Your transaction may still be pending on the network. You can close this window and check your activation status later.");
    }, VERIFY_TIMEOUT_MS);
  }, [minAmountUsdt, cleanup]);

  const reset = useCallback(() => {
    cleanup();
    setStatus("idle");
    setMessage("");
    setTxId("");
  }, [cleanup]);

  return { status, message, txId, startChecking, reset };
}
