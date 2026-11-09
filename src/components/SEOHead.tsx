import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SITE, faqSchema, pageMeta } from "../seoMeta";

const noindexPaths = ["/editor", "/s"];

export function SEOHead() {
  const { pathname } = useLocation();

  useEffect(() => {
    const page = pageMeta[pathname] ?? pageMeta["/"];
    const url = `${SITE}${pathname}`;

    document.title = page.title;

    setMeta("description", page.description);
    setMeta("og:title", page.title);
    setMeta("og:description", page.description);
    setMeta("og:url", url);
    setCanonical(url);
    setRobots(noindexPaths.some((p) => pathname === p || pathname.startsWith(p + "/")) ? "noindex, nofollow" : null);

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

function setRobots(content: string | null) {
  let el = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
  if (!content) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", "robots");
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}
