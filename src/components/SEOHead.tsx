import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE = "https://imagepipeline.art";

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
