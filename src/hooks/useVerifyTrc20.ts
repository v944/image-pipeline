import { useState, useRef, useEffect } from "react";

const TRONSCAN_API = "https://apilist.tronscan.org/api/transaction";

interface Trc20Transfer {
  to_address: string;
  amount_str: string;
  transaction_id: string;
  block_ts: number;
}

interface TronscanResponse {
  data: {
    trc20Transfers?: Trc20Transfer[];
  }[];
}

export function useVerifyTrc20(
  address: string,
  minAmountUsdt: number
) {
  const [status, setStatus] = useState<"idle" | "checking" | "verified" | "not-found">("idle");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startChecking = () => {
    setStatus("checking");

    const check = async () => {
      try {
        const url = `${TRONSCAN_API}?sort=-timestamp&limit=20&address=${address}&start_timestamp=${Date.now() - 180_000}`;
        const res = await fetch(url);
        if (!res.ok) return;
        const json: TronscanResponse = await res.json();

        const amountWei = (minAmountUsdt * 1_000_000).toString();

        for (const item of json.data || []) {
          const transfers = item.trc20Transfers || [];
          for (const tx of transfers) {
            if (
              tx.to_address.toLowerCase() === address.toLowerCase() &&
              parseInt(tx.amount_str) >= parseInt(amountWei)
            ) {
              setStatus("verified");
              if (intervalRef.current) clearInterval(intervalRef.current);
              return;
            }
          }
        }

        setStatus("not-found");
      } catch {
        setStatus("not-found");
      }
    };

    check();
    intervalRef.current = setInterval(check, 10_000);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { status, startChecking };
}
