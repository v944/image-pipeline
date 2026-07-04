import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

const COOKIE_CONSENT_KEY = "ip-cookie-consent";

export function CookieBanner() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (stored !== "accepted" && stored !== "rejected") {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setVisible(false);
  };

  const reject = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "rejected");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative p-4">
        <div className="max-w-3xl mx-auto bg-[#2A2A3A] border border-[#555570] rounded-2xl p-5 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm text-gray-100 font-semibold mb-1">{t("cookie.title")}</p>
              <p className="text-xs text-gray-300 leading-relaxed">
                {t("cookie.desc")}
              </p>
            </div>
            <button
              onClick={reject}
              className="p-1 text-gray-400 hover:text-gray-100 transition-colors flex-shrink-0"
              aria-label={t("common.close")}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={accept}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-amber-500/25"
            >
              {t("cookie.acceptAll")}
            </button>
            <button
              onClick={reject}
              className="px-5 py-2.5 border border-[#555570] hover:bg-[#3A3A4E] text-gray-200 text-sm font-medium rounded-lg transition-colors"
            >
              {t("cookie.necessaryOnly")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
