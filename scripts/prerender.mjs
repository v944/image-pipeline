import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { createServer } from "vite";
import { Window } from "happy-dom";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// DOM-глобалы до импорта приложения: zustand-persist и i18n читают localStorage при создании стора
const window = new Window({ url: "https://imagepipeline.art/" });
const globals = {
  window,
  document: window.document,
  localStorage: window.localStorage,
  HTMLElement: window.HTMLElement,
  Element: window.Element,
  Node: window.Node,
  Event: window.Event,
  CustomEvent: window.CustomEvent,
  getComputedStyle: window.getComputedStyle.bind(window),
  requestAnimationFrame: (cb) => setTimeout(cb, 0),
  cancelAnimationFrame: (id) => clearTimeout(id),
  matchMedia: window.matchMedia.bind(window),
};
for (const [key, value] of Object.entries(globals)) {
  if (!(key in globalThis)) {
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  }
}

const vite = await createServer({
  configFile: join(root, "vite.config.ts"),
  root,
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "warn",
});

try {
  const [{ render }, { pageMeta, faqSchema, prerenderRoutes, SITE }] = await Promise.all([
    vite.ssrLoadModule("/src/entry-server.tsx"),
    vite.ssrLoadModule("/src/seoMeta.ts"),
  ]);

  const template = readFileSync(join(root, "dist/index.html"), "utf-8");
  const builtJs = /<script type="module"[^>]*src="([^"]+)"/.exec(template)?.[1] ?? null;
  if (!builtJs) throw new Error("Не найден script type=module в dist/index.html");

  // SPA-шелл для noindex-роутов (/editor, /s/:id) и несовпавших путей
  writeFileSync(join(root, "dist/app.html"), template);

  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

  for (const route of prerenderRoutes) {
    const meta = pageMeta[route];
    const canonical = route === "/" ? `${SITE}/` : `${SITE}${route}`;
    const body = render(route);

    let html = template
      .replace(/<title>[^<]*<\/title>/, `<title>${esc(meta.title)}</title>`)
      .replace(
        /<meta name="description" content="[^"]*"\s*\/?>/,
        `<meta name="description" content="${esc(meta.description)}" />`
      );

    const headTags = [
      `    <link rel="canonical" href="${canonical}" />`,
      `    <meta property="og:title" content="${esc(meta.title)}" />`,
      `    <meta property="og:description" content="${esc(meta.description)}" />`,
      `    <meta property="og:url" content="${canonical}" />`,
    ];
    if (route === "/") {
      headTags.push(
        `    <script type="application/ld+json" data-jsonld="faq">${JSON.stringify(faqSchema)}</script>`
      );
    }
    html = html.replace(/<meta name="description"[^>]*\/>/, (m) => m + "\n" + headTags.join("\n"));

    html = html.replace(/<div id="root">[\s\S]*?<\/div>(?=\s*<noscript>)/, () => `<div id="root">${body}</div>`);

    const outFile = route === "/" ? "index.html" : join(route.slice(1), "index.html");
    const outPath = join(root, "dist", outFile);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, html);
    console.log(`prerender: ${route} -> dist/${outFile} (${body.length} bytes HTML)`);
  }

  // sitemap.xml с lastmod из дат изменения исходников страниц
  const sharedSources = ["src/i18n/en.json", "src/seoMeta.ts"];
  const routeSources = {
    "/": ["src/components/landing", "src/components/pricing/PricingPage.tsx", ...sharedSources],
    "/faq": ["src/pages/FaqPage.tsx", ...sharedSources],
    "/pricing": ["src/components/pricing/PricingPage.tsx", ...sharedSources],
    "/privacy": ["src/pages/PrivacyPage.tsx", ...sharedSources],
    "/terms": ["src/pages/TermsPage.tsx", ...sharedSources],
  };
  const lastmod = (files) => {
    // дата последнего коммита, затронувшего исходники страницы (на Vercel mtime = дата клона)
    try {
      const out = execFileSync("git", ["log", "-1", "--format=%cs", "--", ...files], { cwd: root, encoding: "utf-8" }).trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(out)) return out;
    } catch { /* не git-окружение */ }
    let latest = 0;
    for (const f of files) {
      try {
        latest = Math.max(latest, statSync(join(root, f)).mtimeMs);
      } catch { /* файл отсутствует */ }
    }
    return new Date(latest).toISOString().slice(0, 10);
  };
  const routePriority = { "/": "1.0", "/faq": "0.8", "/pricing": "0.7", "/privacy": "0.5", "/terms": "0.5" };
  const urls = prerenderRoutes
    .map((route) => {
      const loc = route === "/" ? `${SITE}/` : `${SITE}${route}`;
      return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod(routeSources[route])}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${routePriority[route]}</priority>\n  </url>`;
    })
    .join("\n\n");
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">

${urls}

</urlset>
`;
  writeFileSync(join(root, "dist/sitemap.xml"), sitemap);
  console.log("prerender: sitemap.xml -> dist/sitemap.xml");
} finally {
  await vite.close();
}

// happy-dom держит event loop (таймеры окна) — после успешной записи завершаемся явно
process.exit(0);
