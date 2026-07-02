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
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="max-w-3xl mx-auto bg-[#1A1A24] border border-white/10 rounded-2xl p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm text-gray-200 font-medium mb-1">{t("cookie.title")}</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              {t("cookie.desc")}
            </p>
          </div>
          <button
            onClick={reject}
            className="p-1 text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0"
            aria-label={t("common.close")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={accept}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-sm font-medium rounded-lg transition-colors"
          >
            {t("cookie.acceptAll")}
          </button>
          <button
            onClick={reject}
            className="px-4 py-2 bg-white/10 hover:bg-white/15 text-gray-200 text-sm font-medium rounded-lg transition-colors"
          >
            {t("cookie.necessaryOnly")}
          </button>
        </div>
      </div>
    </div>
  );
}
