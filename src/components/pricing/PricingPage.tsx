import { useState } from "react";
import { Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CryptoModal } from "./CryptoModal";
import { useUserStore } from "../../stores/user.store";
import { trackEvent, Events } from "../../lib/analytics";

export function PricingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const plan = useUserStore((s) => s.plan);
  const [cryptoTier, setCryptoTier] = useState<"pro" | "lifetime" | null>(null);

  const PLANS = [
    {
      tier: "free" as const,
      name: t("pricing.free"),
      price: "$0",
      period: t("pricing.freePeriod"),
      features: [
        t("pricing.features.freeFiles"),
        t("pricing.features.freeNodes"),
        t("pricing.features.freeBatches"),
        t("pricing.features.freeFormats"),
        t("pricing.features.freeFileSize"),
        t("pricing.features.freeNodesAll"),
      ],
      cta: t("common.getStarted"),
      action: "navigate" as const,
    },
    {
      tier: "pro" as const,
      name: t("pricing.pro"),
      price: "$10",
      period: t("pricing.proPeriod"),
      features: [
        t("pricing.features.proFiles"),
        t("pricing.features.proNodes"),
        t("pricing.features.proBatches"),
        t("pricing.features.proFormats"),
        t("pricing.features.proFileSize"),
        t("pricing.features.proUpscaling"),
        t("pricing.features.proSupport"),
      ],
      cta: t("pricing.buyCrypto"),
      action: "crypto" as const,
      popular: true,
    },
    {
      tier: "lifetime" as const,
      name: t("pricing.lifetime"),
      price: "$30",
      period: t("pricing.lifetimePeriod"),
      features: [
        t("pricing.features.lifetimeEverything"),
        t("pricing.features.lifetimeNoExpiry"),
        t("pricing.features.lifetimeFuture"),
        t("pricing.features.lifetimeEarlyAccess"),
        t("pricing.features.lifetimeCredits"),
      ],
      cta: t("pricing.buyCrypto"),
      action: "crypto" as const,
    },
  ];

  return (
    <section className="max-w-6xl mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-3">{t("pricing.title")}</h2>
        <p className="text-gray-400">{t("pricing.subtitle")}</p>
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
                  {t("pricing.popular")}
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
                  {t("pricing.currentPlan")}
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
                  onClick={() => {
                    setCryptoTier(p.tier);
                    trackEvent(Events.PURCHASE_INITIATED, { plan: p.tier, price: p.tier === "pro" ? 10 : 30 });
                  }}
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
