# Image Pipeline — Sitemap + robots.txt
## Техническое SEO для imagepipeline.art

**Проект:** Image Pipeline  
**Домен:** `https://imagepipeline.art` (canonical, non-www)  
**Дата:** 2026-07-01  
**Владелец:** Maxim Mitenkov (vimark.art)

---

## 1. Общие правила

- `robots.txt` и `sitemap.xml` размещаются в корне сайта (папка `public/` для Vercel).
- URL должны быть доступны:
  - `https://imagepipeline.art/robots.txt`
  - `https://imagepipeline.art/sitemap.xml`
- В `robots.txt` указывается ссылка на sitemap.
- В Google Search Console (уже подключён) добавьте sitemap в раздел **Sitemaps**.

---

## 2. robots.txt

Создать файл `public/robots.txt`:

```
User-agent: *
Allow: /

# Disallow admin or private routes (if any)
# Disallow: /admin/
# Disallow: /api/

# Sitemap location
Sitemap: https://imagepipeline.art/sitemap.xml

# Crawl delay (optional, uncomment if needed)
# Crawl-delay: 1
```

### Пояснения

| Директива | Значение |
|-----------|----------|
| `User-agent: *` | Правила для всех поисковых роботов |
| `Allow: /` | Разрешить индексацию всего сайта |
| `Sitemap:` | URL к sitemap.xml (обязательно полный URL с https://) |

---

## 3. sitemap.xml

**Актуально (с 2026-11-09):** `sitemap.xml` **генерируется автоматически при сборке** скриптом `scripts/prerender.mjs` (шаг `node scripts/prerender.mjs` в `npm run build`). Ручной файл `public/sitemap.xml` удалён.

- Скрипт пишет `dist/sitemap.xml` после `vite build` (файл из `public/` перезаписывается — поэтому его и убрали).
- `<lastmod>` берётся из **даты последнего git-коммита**, затронувшего исходники страницы (для `/` — `src/components/landing/`, `src/components/pricing/PricingPage.tsx`, `src/i18n/en.json`, `src/seoMeta.ts`; для остальных — их страница + `en.json` + `seoMeta.ts`). Вне git-окружения — фолбэк на mtime файлов.
- Чтобы добавить страницу в sitemap: добавьте роут в `prerenderRoutes` и `pageMeta` в `src/seoMeta.ts`, а путь к файлам страницы — в `routeSources` в `scripts/prerender.mjs`.

Историческая ручная разметка (для справки):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">

  <!-- Homepage -->
  <url>
    <loc>https://imagepipeline.art/</loc>
    <lastmod>2026-07-01</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>

</urlset>
```

### Пояснения тегов

| Тег | Описание | Рекомендации |
|-----|----------|--------------|
| `<loc>` | URL страницы | Полный URL с `https://` и без `www` |
| `<lastmod>` | Дата последнего изменения | Формат `YYYY-MM-DD`. Обновлять при изменениях |
| `<changefreq>` | Предполагаемая частота обновления | `always`, `hourly`, `daily`, `weekly`, `monthly`, `yearly`, `never` |
| `<priority>` | Приоритет страницы относительно других | `0.0` – `1.0`. Главная = `1.0`, второстепенные = `0.3–0.5` |

---

## 4. Если страниц больше — расширенный sitemap

Если у сайта появляются дополнительные страницы (блог, документация, кейсы):
1. Добавьте роут в `prerenderRoutes` и мету в `pageMeta` (`src/seoMeta.ts`).
2. Добавьте файлы страницы в `routeSources` (`scripts/prerender.mjs`) — чтобы `lastmod` считался по её изменениям.

```text
Пример: новая страница /blog
  src/seoMeta.ts:        pageMeta['/blog'] = {...}; prerenderRoutes.push('/blog')
  scripts/prerender.mjs: routeSources['/blog'] = ['src/pages/BlogPage.tsx', ...sharedSources]
```

---

## 5. Автоматическая генерация sitemap (для динамических сайтов)

> **В этом проекте уже реализовано** — генерация встроена в `scripts/prerender.mjs` (см. раздел 3). Ниже примеры для других стеков, если проект переедет.

Если проект на React/Vue/Next.js и страницы генерируются динамически, используйте библиотеку:

### Next.js
```bash
npm install next-sitemap
```

`next-sitemap.config.js`:
```javascript
module.exports = {
  siteUrl: 'https://imagepipeline.art',
  generateRobotsTxt: true,
  changefreq: 'weekly',
  priority: 0.7,
  sitemapSize: 5000,
}
```

### Vite / Vanilla JS (генерация скриптом)

Создать `scripts/generate-sitemap.js`:

```javascript
const fs = require('fs');
const pages = [
  { url: '/', priority: '1.0', changefreq: 'weekly' },
  // { url: '/pricing', priority: '0.8', changefreq: 'monthly' },
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(p => `
  <url>
    <loc>https://imagepipeline.art${p.url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('')}
</urlset>`;

fs.writeFileSync('public/sitemap.xml', sitemap.trim());
console.log('sitemap.xml generated');
```

Добавить в `package.json`:
```json
"scripts": {
  "build": "node scripts/generate-sitemap.js && vite build"
}
```

---

## 6. Чек-лист для агента

- [x] Создать файл `public/robots.txt` с содержимым из раздела 2
- [ ] sitemap.xml генерируется сборкой (`scripts/prerender.mjs`) — вручную не создавать; убедиться, что `npm run build` отрабатывает без ошибок
- [ ] Задеплоить на Vercel
- [ ] Проверить доступность:
  - `https://imagepipeline.art/robots.txt`
  - `https://imagepipeline.art/sitemap.xml`
- [ ] Добавить sitemap в Google Search Console:
  - Открыть [search.google.com/search-console](https://search.google.com/search-console)
  - Выбрать `imagepipeline.art` → **Sitemaps**
  - Ввести: `sitemap.xml` → **Submit**
- [ ] Добавить sitemap в Yandex Webmaster (если нужно):
  - [webmaster.yandex.com](https://webmaster.yandex.com) → `imagepipeline.art` → **Indexing** → **Sitemap files**
- [ ] Добавить sitemap в Bing Webmaster (если нужно):
  - [bing.com/webmasters](https://bing.com/webmasters) → `imagepipeline.art` → **Sitemaps**

---

## 7. Проверка после деплоя

| URL | Ожидаемый результат |
|-----|---------------------|
| `https://imagepipeline.art/robots.txt` | Текст с `User-agent`, `Allow`, `Sitemap` |
| `https://imagepipeline.art/sitemap.xml` | XML с `<urlset>`, `<url>`, `<loc>` |
| Валидатор sitemap | [xml-sitemaps.com/validate-xml-sitemap.html](https://www.xml-sitemaps.com/validate-xml-sitemap.html) — без ошибок |

---

*Документ составлен: 2026-07-01*  
*Владелец: Maxim Mitenkov (vimark.art)*  
*Домен: https://imagepipeline.art*
