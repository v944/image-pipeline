import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE = "https://imagepipeline.art";

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Do I need a crypto wallet to pay?",
      acceptedAnswer: { "@type": "Answer", text: "No. You can pay in Telegram via CryptoBot in two taps — or transfer USDT (TRC-20) from any wallet or exchange." },
    },
    {
      "@type": "Question",
      name: "Where are my images uploaded?",
      acceptedAnswer: { "@type": "Answer", text: "Nowhere. All processing runs in your browser via the Canvas API. Close the tab — nothing is stored anywhere." },
    },
    {
      "@type": "Question",
      name: "What do I get for free?",
      acceptedAnswer: { "@type": "Answer", text: "10 files per batch, 4 nodes per pipeline, 10 batches a day — all node types included, no signup." },
    },
    {
      "@type": "Question",
      name: "Is it a subscription?",
      acceptedAnswer: { "@type": "Answer", text: "No. Pro is a one-time payment, Lifetime is Pro forever — including future nodes." },
    },
  ],
};

const pages: Record<string, { title: string; description: string }> = {
  "/": {
    title: "Image Pipeline — Batch Image Processing",
    description:
      "Browser-based batch image processing with a visual node editor. Resize, crop, compress, and convert images — all locally.",
  },
  "/faq": {
    title: "FAQ — Image Pipeline",
    description:
      "Frequently asked questions about Image Pipeline — browser-based batch image processing.",
  },
  "/pricing": {
    title: "Pricing — Image Pipeline",
    description:
      "Affordable one-time payment pricing for Image Pipeline. Free tier available. No subscriptions.",
  },
  "/privacy": {
    title: "Privacy Policy — Image Pipeline",
    description:
      "Privacy policy for Image Pipeline. Your images never leave your device.",
  },
  "/terms": {
    title: "Terms of Service — Image Pipeline",
    description: "Terms of service for Image Pipeline batch image processing tool.",
  },
  "/editor": {
    title: "Editor — Image Pipeline",
    description:
      "Visual node editor for batch image processing. Resize, crop, compress, and convert images.",
  },
};

export function SEOHead() {
  const { pathname } = useLocation();

  useEffect(() => {
    const page = pages[pathname] ?? pages["/"];
    const url = `${SITE}${pathname}`;

    document.title = page.title;

    setMeta("description", page.description);
    setMeta("og:title", page.title);
    setMeta("og:description", page.description);
    setMeta("og:url", url);
    setCanonical(url);

    const faqScript = document.querySelector('script[data-jsonld="faq"]');
    if (pathname === "/") {
      let script = faqScript ?? document.createElement("script");
      script.setAttribute("type", "application/ld+json");
      script.setAttribute("data-jsonld", "faq");
      if (!faqScript) document.head.appendChild(script);
      script.textContent = JSON.stringify(faqSchema);
    } else if (faqScript) {
      faqScript.remove();
    }
  }, [pathname]);

  return null;
}

function setMeta(property: string, content: string) {
  let el = document.querySelector(`meta[property="${property}"], meta[name="${property}"]`);
  if (!el) {
    el = document.createElement("meta");
    if (property.startsWith("og:")) {
      el.setAttribute("property", property);
    } else {
      el.setAttribute("name", property);
    }
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href: string) {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}
