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

Создать файл `public/sitemap.xml`:

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

  <!-- Pricing / Plans page (if exists) -->
  <!--
  <url>
    <loc>https://imagepipeline.art/pricing</loc>
    <lastmod>2026-07-01</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  -->

  <!-- Privacy Policy (if exists) -->
  <!--
  <url>
    <loc>https://imagepipeline.art/privacy</loc>
    <lastmod>2026-07-01</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  -->

  <!-- Terms of Service (if exists) -->
  <!--
  <url>
    <loc>https://imagepipeline.art/terms</loc>
    <lastmod>2026-07-01</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  -->

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

Если у сайта появляются дополнительные страницы (блог, документация, кейсы), раскомментируйте блоки выше и добавьте новые:

```xml
  <!-- Blog / Articles -->
  <url>
    <loc>https://imagepipeline.art/blog</loc>
    <lastmod>2026-07-01</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>

  <!-- Individual blog post -->
  <url>
    <loc>https://imagepipeline.art/blog/batch-resize-guide</loc>
    <lastmod>2026-07-01</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.6</priority>
  </url>
```

---

## 5. Автоматическая генерация sitemap (для динамических сайтов)

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

- [ ] Создать файл `public/robots.txt` с содержимым из раздела 2
- [ ] Создать файл `public/sitemap.xml` с содержимым из раздела 3
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
