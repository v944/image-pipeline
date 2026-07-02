import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronDown, ExternalLink, ArrowRight } from "lucide-react";

const FAQ_KEYS = Array.from({ length: 12 }, (_, i) => i + 1);

function AccordionItem({
  question,
  answer,
  open,
  onToggle,
}: {
  question: string;
  answer: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-white/5">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4 text-left text-gray-200 hover:text-amber-400 transition-colors"
      >
        <span className="text-sm font-medium">{question}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform flex-shrink-0 ml-4 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="pb-4 text-sm text-gray-400 leading-relaxed">{answer}</div>
      )}
    </div>
  );
}

export function FaqPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  const faqItems = FAQ_KEYS.map((n) => ({
    question: t(`faq.q${n}`),
    answer: t(`faq.q${n}a`),
  }));

  return (
    <>
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": faqItems.map((item) => ({
            "@type": "Question",
            "name": item.question,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": item.answer,
            },
          })),
        })}
      </script>

      <div className="min-h-screen bg-[#0D0D14] text-gray-100">
        <header className="border-b border-white/5">
          <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <img src="/logo.png" alt={t("common.appName")} className="w-8 h-8" />
              <span className="font-bold text-base">{t("common.appName")}</span>
            </button>
            <a
              href="https://github.com/v944/image-pipeline"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors"
            >
              {t("common.github")} <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-6 py-12">
          <h1 className="text-3xl font-bold mb-2">{t("faq.title")}</h1>
          <p className="text-gray-400 text-sm mb-8">
            {t("faq.subtitle")}
          </p>

          <div className="border-t border-white/5">
            {faqItems.map((item, i) => (
              <AccordionItem
                key={i}
                question={item.question}
                answer={item.answer}
                open={openIndex === i}
                onToggle={() => toggle(i)}
              />
            ))}
          </div>

          <div className="mt-12 text-center p-8 rounded-2xl border border-white/5 bg-white/[0.02]">
            <h2 className="text-lg font-semibold mb-2">{t("faq.stillHaveQuestions")}</h2>
            <p className="text-sm text-gray-400 mb-4">
              {t("faq.openIssue")}
            </p>
            <button
              onClick={() => navigate("/editor")}
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              {t("common.openEditor")} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </main>

        <footer className="border-t border-white/5 py-8 mt-12">
          <div className="max-w-3xl mx-auto px-6 flex items-center justify-between text-sm text-gray-500">
            <span>{t("common.appName")} &mdash; Open source batch image processing</span>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/v944/image-pipeline"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-300 transition-colors"
              >
                {t("common.github")}
              </a>
              <button onClick={() => navigate("/privacy")} className="hover:text-gray-300 transition-colors">{t("common.privacy")}</button>
              <button onClick={() => navigate("/terms")} className="hover:text-gray-300 transition-colors">{t("common.terms")}</button>
              <button onClick={() => navigate("/")} className="hover:text-gray-300 transition-colors">
                {t("common.home")}
              </button>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
