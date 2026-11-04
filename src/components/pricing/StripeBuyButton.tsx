import { useEffect, useState } from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "stripe-buy-button": {
        "buy-button-id"?: string;
        "publishable-key"?: string;
        "client-reference-id"?: string;
      };
    }
  }
}

const STRIPE_BUY_BUTTON_SCRIPT = "https://js.stripe.com/v3/buy-button.js";

let stripeScriptPromise: Promise<void> | null = null;

function loadStripeBuyButtonScript(): Promise<void> {
  if (!stripeScriptPromise) {
    stripeScriptPromise = new Promise<void>((resolve, reject) => {
      if (document.querySelector(`script[src="${STRIPE_BUY_BUTTON_SCRIPT}"]`)) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = STRIPE_BUY_BUTTON_SCRIPT;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        stripeScriptPromise = null;
        reject(new Error("Failed to load Stripe buy button script"));
      };
      document.head.appendChild(script);
    });
  }
  return stripeScriptPromise;
}

interface StripeBuyButtonProps {
  buyButtonId: string;
  publishableKey: string;
  clientReferenceId: string;
}

export function StripeBuyButton({ buyButtonId, publishableKey, clientReferenceId }: StripeBuyButtonProps) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadStripeBuyButtonScript()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) return null;

  if (!ready) {
    return <div className="h-10 rounded-xl bg-white/5 animate-pulse" aria-hidden="true" />;
  }

  return (
    <stripe-buy-button
      buy-button-id={buyButtonId}
      publishable-key={publishableKey}
      client-reference-id={clientReferenceId}
    />
  );
}
