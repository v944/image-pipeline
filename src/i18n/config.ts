import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en.json";
import ru from "./ru.json";

const savedLang = typeof window !== "undefined" ? localStorage.getItem("ip-lang") : null;

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ru: { translation: ru },
  },
  lng: savedLang || "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export function setLanguage(lang: "en" | "ru") {
  localStorage.setItem("ip-lang", lang);
  void i18n.changeLanguage(lang);
}

export default i18n;
