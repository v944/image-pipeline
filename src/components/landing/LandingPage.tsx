import { useState } from "react";
import { ArrowRight, Shield, Zap, Layers, Check, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PricingPage } from "../pricing/PricingPage";
import { LanguageSwitcher } from "../layout/LanguageSwitcher";

export function LandingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

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

          <div className="max-w-3xl mx-auto mb-10 rounded-xl overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.3)]">
            <img
              src="/demo.gif"
              alt="Image Pipeline demo: drag images, add nodes, process, download ZIP"
              className="w-full h-auto block"
              loading="lazy"
            />
          </div>

          <div className="cta-wrapper">
            <button
              onClick={() => navigate("/editor")}
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black px-10 py-4 rounded-xl text-xl font-bold transition-all hover:-translate-y-0.5 shadow-[0_4px_15px_rgba(245,158,11,0.4)] hover:shadow-[0_8px_25px_rgba(245,158,11,0.5)]"
            >
              {t("landing.ctaButton")}
              <ArrowRight className="w-5 h-5" />
            </button>
            <p className="mt-3 text-sm text-gray-500">
              {t("landing.ctaSubtext")}
            </p>
            <p className="flex justify-center gap-6 mt-4 text-sm text-gray-500 flex-wrap">
              <span className="inline-flex items-center gap-1">{t("landing.trustNoSignup")}</span>
              <span className="inline-flex items-center gap-1">{t("landing.trustNoCard")}</span>
              <span className="inline-flex items-center gap-1">{t("landing.trustBrowser")}</span>
            </p>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl font-bold mb-10">{t("landing.howTitle")}</h2>
          <div className="grid grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="text-4xl mb-3">{t("landing.howStep1Icon")}</div>
              <h3 className="text-lg font-semibold mb-2">{t("landing.howStep1")}</h3>
              <p className="text-sm text-gray-400">{t("landing.howStep1Desc")}</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="text-4xl mb-3">{t("landing.howStep2Icon")}</div>
              <h3 className="text-lg font-semibold mb-2">{t("landing.howStep2")}</h3>
              <p className="text-sm text-gray-400">{t("landing.howStep2Desc")}</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="text-4xl mb-3">{t("landing.howStep3Icon")}</div>
              <h3 className="text-lg font-semibold mb-2">{t("landing.howStep3")}</h3>
              <p className="text-sm text-gray-400">{t("landing.howStep3Desc")}</p>
            </div>
          </div>
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

        <section className="max-w-6xl mx-auto px-6 py-16 text-center border-t border-white/5">
          <div className="flex justify-center mb-8">
            <a href="https://www.producthunt.com/products/image-pipeline-batch-image-processing?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-image-pipeline-2" target="_blank" rel="noopener noreferrer">
              <img alt="Image Pipeline - Batch image processing in browser. No signup. | Product Hunt" width="250" height="54" src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1189401&theme=dark&t=1783590825782" />
            </a>
          </div>
          <div className="grid grid-cols-2 gap-8 max-w-md mx-auto mb-10">
            <div>
              <div className="text-2xl font-bold text-amber-400">{t("landing.statUsers")}</div>
              <div className="text-sm text-gray-400">{t("landing.statUsersLabel")}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-400">{t("landing.statImages")}</div>
              <div className="text-sm text-gray-400">{t("landing.statImagesLabel")}</div>
            </div>
          </div>
          <blockquote className="max-w-xl mx-auto text-gray-400 italic">
            &ldquo;{t("landing.testimonial")}&rdquo;
            <cite className="block text-sm text-gray-500 mt-2 not-italic">&mdash; {t("landing.testimonialAuthor")}</cite>
          </blockquote>
        </section>

        <section className="max-w-6xl mx-auto px-6 py-12 text-center border-t border-white/5">
          <h2 className="text-2xl font-bold mb-2">{t("landing.emailTitle")}</h2>
          <p className="text-gray-400 mb-6">{t("landing.emailDesc")}</p>
          <form className="max-w-md mx-auto flex gap-3" onSubmit={async (e) => {
            e.preventDefault();
            if (!email || emailStatus === "loading") return;
            setEmailStatus("loading");
            try {
              const res = await fetch("/api/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
              });
              if (!res.ok) throw new Error("Failed");
              setEmailStatus("success");
            } catch {
              setEmailStatus("error");
            }
          }}>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailStatus("idle"); }}
              placeholder={t("landing.emailPlaceholder")}
              required
              className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-gray-100 placeholder-gray-500 text-sm focus:outline-none focus:border-amber-500 transition-colors"
            />
            <button
              type="submit"
              disabled={emailStatus === "loading" || emailStatus === "success"}
              className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-black text-sm font-medium transition-colors flex items-center gap-2"
            >
              {emailStatus === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : emailStatus === "success" ? <Check className="w-4 h-4" /> : null}
              {emailStatus === "success" ? t("landing.emailSuccess") : t("landing.emailButton")}
            </button>
          </form>
          {emailStatus === "error" && <p className="text-red-400 text-xs mt-2">{t("landing.emailError")}</p>}
          <p className="text-xs text-gray-600 mt-3">{t("landing.emailPrivacy")}</p>
        </section>

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
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-center gap-6 mb-6 flex-wrap">
            <a href="https://www.producthunt.com/products/image-pipeline-batch-image-processing?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-image-pipeline-2" target="_blank" rel="noopener noreferrer">
              <img alt="Image Pipeline - Batch image processing in browser. No signup. | Product Hunt" width="250" height="54" src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1189401&theme=dark&t=1783590825782" />
            </a>
            <a href="https://tools.launchllama.co/products/image-pipeline?utm_source=badge&utm_medium=referral" target="_blank" rel="noopener noreferrer">
              <img src="https://speaktechenglish.com/wp-content/uploads/2026/04/Screenshot_2026-04-09_at_17.40.44-removebg-preview.png" alt="Featured on Launch Llama" width="200" height="50" />
            </a>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{t("common.appName")} &mdash; Open source batch image processing</span>
            <div className="flex items-center gap-4">
              <a href="https://github.com/v944/image-pipeline" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300 transition-colors">{t("common.github")}</a>
              <button onClick={() => navigate("/faq")} className="hover:text-gray-300 transition-colors">{t("common.faq")}</button>
              <button onClick={() => navigate("/privacy")} className="hover:text-gray-300 transition-colors">{t("common.privacy")}</button>
              <button onClick={() => navigate("/terms")} className="hover:text-gray-300 transition-colors">{t("common.terms")}</button>
            </div>
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
