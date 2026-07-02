import { useTranslation } from "react-i18next";
import { setLanguage } from "../../i18n/config";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language;

  return (
    <button
      onClick={() => setLanguage(current === "en" ? "ru" : "en")}
      className="text-xs font-medium text-gray-500 hover:text-gray-300 transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
      title={current === "en" ? "Switch to Russian" : "Переключить на английский"}
    >
      {current === "en" ? "RU" : "EN"}
    </button>
  );
}
