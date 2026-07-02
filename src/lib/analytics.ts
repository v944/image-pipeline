const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;
const STORAGE_KEY = "ip-cookie-consent";
let loaded = false;

function hasConsent(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) === "accepted";
}

function loadGtag(): void {
  if (loaded || !GA_MEASUREMENT_ID || !hasConsent()) return;
  loaded = true;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", GA_MEASUREMENT_ID, {
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
}

export function trackEvent(
  eventName: string,
  eventParams?: Record<string, string | number | boolean>,
): void {
  loadGtag();
  if (GA_MEASUREMENT_ID && hasConsent() && window.gtag) {
    window.gtag("event", eventName, eventParams);
  }
}

export const Events = {
  FILE_UPLOAD: "file_upload",
  NODE_ADDED: "node_added",
  PIPELINE_PROCESS: "pipeline_process",
  PURCHASE_INITIATED: "purchase_initiated",
  PURCHASE_COMPLETED: "purchase_completed",
  SHARE_CLICKED: "share_clicked",
} as const;
