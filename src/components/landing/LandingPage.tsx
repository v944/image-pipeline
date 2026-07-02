import { ArrowRight, Shield, Zap, Layers } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PricingPage } from "../pricing/PricingPage";
import { LanguageSwitcher } from "../layout/LanguageSwitcher";

export function LandingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[#0D0D14] text-gray-100 overflow-y-auto">
      <header className="border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt={t("common.appName")} className="w-10 h-10" />
            <span className="font-bold">{t("common.appName")}</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/editor")}
              className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
            >
              {t("common.openEditor")}
            </button>
            <button
              onClick={() => navigate("/pricing")}
              className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
            >
              {t("pricing.title")}
            </button>
            <LanguageSwitcher />
            <button
              onClick={() => navigate("/editor")}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {t("common.getStarted")}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="max-w-6xl mx-auto px-6 pt-16 pb-8 text-center">
          <h1 className="text-5xl font-bold leading-tight mb-4">
            {t("landing.heroTitle")}
            <br />
            <span className="text-amber-400">{t("landing.heroAccent")}</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
            {t("landing.heroDesc")}
          </p>
          <button
            onClick={() => navigate("/editor")}
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black px-6 py-3 rounded-xl text-base font-medium transition-colors"
          >
            {t("common.startBuilding")}
            <ArrowRight className="w-5 h-5" />
          </button>
        </section>

        <section className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-3 gap-6">
            <FeatureCard
              icon={Zap}
              title={t("landing.featureBatch")}
              description={t("landing.featureBatchDesc")}
            />
            <FeatureCard
              icon={Shield}
              title={t("landing.featurePrivacy")}
              description={t("landing.featurePrivacyDesc")}
            />
            <FeatureCard
              icon={Layers}
              title={t("landing.featureNodeEditor")}
              description={t("landing.featureNodeEditorDesc")}
            />
          </div>
        </section>

        <PricingPage />

        <section className="max-w-6xl mx-auto px-6 pt-8 pb-16 text-center border-t border-white/5">
          <h2 className="text-2xl font-bold mb-3">{t("landing.ctaTitle")}</h2>
          <p className="text-gray-400 mb-4">{t("landing.ctaDesc")}</p>
          <button
            onClick={() => navigate("/editor")}
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black px-6 py-3 rounded-xl text-base font-medium transition-colors"
          >
            {t("common.openEditor")}
            <ArrowRight className="w-5 h-5" />
          </button>
        </section>
      </main>

      <footer className="border-t border-white/5 py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm text-gray-500">
          <span>{t("common.appName")} &mdash; Open source batch image processing</span>
          <div className="flex items-center gap-4">
            <a href="https://github.com/v944/image-pipeline" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300 transition-colors">{t("common.github")}</a>
            <button onClick={() => navigate("/faq")} className="hover:text-gray-300 transition-colors">{t("common.faq")}</button>
            <button onClick={() => navigate("/privacy")} className="hover:text-gray-300 transition-colors">{t("common.privacy")}</button>
            <button onClick={() => navigate("/terms")} className="hover:text-gray-300 transition-colors">{t("common.terms")}</button>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
      <Icon className="w-8 h-8 text-amber-400 mb-3" />
      <h3 className="text-base font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  );
}
