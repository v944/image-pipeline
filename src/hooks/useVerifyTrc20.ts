import { useState, useRef, useCallback, useEffect } from "react";

type VerifyStatus = "idle" | "checking" | "verified" | "not-found" | "error";

export function useVerifyTrc20(_address: string, minAmountUsdt: number) {
  const [status, setStatus] = useState<VerifyStatus>("idle");
  const [message, setMessage] = useState("");
  const [txId, setTxId] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIdRef = useRef("");

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startChecking = useCallback((sessionId: string, transactionId: string) => {
    if (!transactionId || transactionId.length !== 64) {
      setStatus("error");
      setMessage("Please enter a valid transaction ID (64 hex characters)");
      return;
    }

    if (intervalRef.current) clearInterval(intervalRef.current);

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
          if (intervalRef.current) clearInterval(intervalRef.current);
          return;
        }

        if (data.data.verified) {
          setStatus("verified");
          setMessage(data.data.message || "Payment confirmed!");
          if (intervalRef.current) clearInterval(intervalRef.current);
        } else {
          setStatus("not-found");
          setMessage(data.data.message || "Transaction not found. Check the TxID and try again.");
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      } catch {
        setStatus("error");
        setMessage("Could not reach verification service. Check your connection and try again.");
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    };

    setStatus("checking");
    verify();
    intervalRef.current = setInterval(verify, 15_000);
  }, [minAmountUsdt]);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setStatus("idle");
    setMessage("");
    setTxId("");
  }, []);

  return { status, message, txId, startChecking, reset };
}
