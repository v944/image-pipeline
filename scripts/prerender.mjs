import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
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
} finally {
  await vite.close();
}

// happy-dom держит event loop (таймеры окна) — после успешной записи завершаемся явно
process.exit(0);
