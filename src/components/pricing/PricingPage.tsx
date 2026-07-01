import { useState } from "react";
import { Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CryptoModal } from "./CryptoModal";
import { useUserStore } from "../../stores/user.store";

const PLANS = [
  {
    tier: "free" as const,
    name: "Free",
    price: "$0",
    period: "forever",
    features: [
      "Up to 10 files per batch",
      "4 nodes per pipeline",
      "10 batches per session",
      "2 output formats",
      "10 MB per file",
      "All processing nodes",
    ],
    cta: "Get Started",
    action: "navigate" as const,
  },
  {
    tier: "pro" as const,
    name: "Pro",
    price: "$10",
    period: "one-time",
    features: [
      "Unlimited files per batch",
      "Unlimited nodes",
      "Unlimited batches",
      "All output formats",
      "500 MB per file",
      "Lanczos3 upscaling",
      "Priority support",
    ],
    cta: "Buy with Crypto",
    action: "crypto" as const,
    popular: true,
  },
  {
    tier: "lifetime" as const,
    name: "Lifetime",
    price: "$30",
    period: "one-time",
    features: [
      "Everything in Pro",
      "No expiration",
      "Future Pro features",
      "Early access to new nodes",
      "Name in credits",
    ],
    cta: "Buy with Crypto",
    action: "crypto" as const,
  },
];

export function PricingPage() {
  const navigate = useNavigate();
  const plan = useUserStore((s) => s.plan);
  const [cryptoTier, setCryptoTier] = useState<"pro" | "lifetime" | null>(null);

  return (
    <section className="max-w-6xl mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-3">Simple Pricing</h2>
        <p className="text-gray-400">Pay once, use forever. No subscriptions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {PLANS.map((p) => {
          const isCurrentPlan = plan === p.tier;
          return (
            <div
              key={p.tier}
              className={`relative rounded-2xl border p-6 flex flex-col ${
                p.popular
                  ? "border-amber-500/40 bg-amber-500/5"
                  : "border-white/5 bg-white/[0.02]"
              }`}
            >
              {p.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-wider bg-amber-500 text-black px-3 py-1 rounded-full">
                  Popular
                </span>
              )}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-1">{p.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{p.price}</span>
                  <span className="text-sm text-gray-500">/{p.period}</span>
                </div>
              </div>
              <ul className="flex-1 space-y-2.5 mb-6">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-400">
                    <Check className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              {isCurrentPlan ? (
                <span className="block text-center text-sm text-amber-400 font-medium py-2.5 border border-amber-500/20 rounded-xl">
                  Current Plan
                </span>
              ) : p.action === "navigate" ? (
                <button
                  onClick={() => navigate("/editor")}
                  className="w-full bg-white/5 hover:bg-white/10 text-gray-200 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                >
                  {p.cta}
                </button>
              ) : (
                <button
                  onClick={() => setCryptoTier(p.tier)}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                >
                  {p.cta}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {cryptoTier && (
        <CryptoModal tier={cryptoTier} onClose={() => setCryptoTier(null)} />
      )}
    </section>
  );
}
