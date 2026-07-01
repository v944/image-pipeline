# Image Pipeline — Domain Setup Guide
## Привязка домена `imagepipeline.art` к Vercel

**Документ для агента/разработчика**  
**Дата:** 2026-07-01  
**Домен:** `imagepipeline.art`  
**Регистратор:** Porkbun  
**Хостинг:** Vercel (проект `image-pipeline-six`)  
**Целевой URL:** `https://imagepipeline.art` (non-www, canonical)

---

## 1. Контекст

- Домен `imagepipeline.art` приобретён на **Porkbun**.
- WHOIS Privacy включён бесплатно (по умолчанию в Porkbun).
- Проект `image-pipeline-six` развёрнут на **Vercel**.
- Требуется: привязать домен к Vercel, настроить SSL, редирект `www` → `non-www`.
- Аналогично настройкам `vimark.art` (non-www canonical, Vercel primary).

---

## 2. Способ подключения: Vercel Nameservers (рекомендуется)

Это предпочтительный способ. Vercel полностью управляет DNS и SSL. Управление DNS-записями переносится из Porkbun в Vercel Dashboard.

### 2.1. Добавить домен в Vercel Dashboard

1. Открыть [vercel.com/dashboard](https://vercel.com/dashboard).
2. Выбрать проект `image-pipeline-six`.
3. Перейти в **Settings → Domains**.
4. В поле ввода ввести: `imagepipeline.art`.
5. Нажать **Add**.
6. Vercel покажет инструкцию с двумя вариантами:
   - **Recommended:** Add Vercel Nameservers
   - Alternative: Add DNS Records
7. Выбрать **"Add Vercel Nameservers"** и запомнить/скопировать:
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```

### 2.2. Сменить Nameservers в Porkbun

1. Открыть [porkbun.com](https://porkbun.com) → **Domain Management**.
2. Найти `imagepipeline.art` → нажать **Details**.
3. В левом меню выбрать **Authoritative Nameservers**.
4. Удалить все текущие записи Porkbun (вида `curitiba.ns.porkbun.com`, `fortaleza.ns.porkbun.com`, `maceio.ns.porkbun.com`, `salvador.ns.porkbun.com`).
5. Добавить записи Vercel:
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```
6. Нажать **Submit**.

> ⚠️ **Важно:** После смены NS управление DNS-записями (A, CNAME, MX, TXT) переходит в Vercel Dashboard. Записи в Porkbun больше не работают. Если нужны почтовые записи или другие DNS — настраивать в Vercel.

### 2.3. Дождаться propagation

- **Обычно:** 5–30 минут.
- **Максимум:** до 24 часов (редко).
- **Проверка:** открыть `https://imagepipeline.art` в браузере.

---

## 3. Альтернативный способ: DNS-записи в Porkbun (если NS менять нельзя)

Если по какой-то причине нельзя менять Nameservers, использовать DNS-записи.

### 3.1. Добавить домен в Vercel Dashboard

1. Vercel Dashboard → `image-pipeline-six` → **Settings → Domains**.
2. Ввести `imagepipeline.art` → **Add**.
3. Выбрать **"Add DNS Records"**.
4. Vercel покажет требуемые записи:
   - **A-запись:** `76.76.21.21`
   - **CNAME:** `cname.vercel-dns.com` (для `www`)

### 3.2. Настроить DNS в Porkbun

1. Porkbun → **Domain Management** → `imagepipeline.art` → **DNS Records**.
2. Удалить все существующие A-записи (если есть).
3. Добавить:
   | Type | Host | Answer | TTL |
   |------|------|--------|-----|
   | A | @ | 76.76.21.21 | 600 |
   | CNAME | www | cname.vercel-dns.com | 600 |
4. Сохранить.

> ⚠️ **Минус:** Vercel не сможет автоматически управлять некоторыми продвинутыми функциями (например, Edge Config через DNS). Для простого сайта — нормально.

---

## 4. Настройка редиректа www → non-www

### 4.1. В Vercel Dashboard

1. **Settings → Domains**.
2. Добавить `www.imagepipeline.art` (если ещё не добавлен).
3. Vercel автоматически предложит настроить редирект на основной домен.
4. Убедиться, что `www.imagepipeline.art` редиректит на `https://imagepipeline.art` (301 Permanent).

### 4.2. Альтернатива: через vercel.json

Если нужно явное правило в коде проекта, добавить в `vercel.json` в корне репозитория:

```json
{
  "redirects": [
    {
      "source": "/",
      "has": [
        {
          "type": "host",
          "value": "www.imagepipeline.art"
        }
      ],
      "destination": "https://imagepipeline.art",
      "permanent": true
    }
  ]
}
```

---

## 5. Проверка работоспособности

### 5.1. Браузер

| URL | Ожидаемый результат |
|-----|---------------------|
| `https://imagepipeline.art` | Сайт открывается, зелёный замок 🔒 |
| `https://www.imagepipeline.art` | 301 редирект на `https://imagepipeline.art` |
| `http://imagepipeline.art` | 301 редирект на `https://imagepipeline.art` |
| `http://www.imagepipeline.art` | 301 редирект на `https://imagepipeline.art` |

### 5.2. Командная строка

```bash
# Проверить DNS
dig imagepipeline.art +short
# Ожидаемый результат: 76.76.21.21 (или CNAME cname.vercel-dns.com)

# Проверить редирект
curl -I -L http://www.imagepipeline.art
# Ожидаемый результат: HTTP/2 301 → Location: https://imagepipeline.art

# Проверить SSL
curl -I https://imagepipeline.art
# Ожидаемый результат: HTTP/2 200, сертификат Vercel
```

### 5.3. Vercel Dashboard

- **Settings → Domains** → статус `imagepipeline.art` должен быть **"Valid"** (зелёная галочка).
- SSL-сертификат выдаётся автоматически Vercel (Let's Encrypt). Проверять отдельно не нужно.

---

## 6. Дополнительные настройки (после подключения домена)

### 6.1. Favicon

Добавить `favicon.ico` и/или `favicon.svg` в корень проекта. Vercel раздаёт статику из `public/`.

### 6.2. Open Graph meta-теги

В `<head>` HTML добавить:

```html
<meta property="og:title" content="Image Pipeline — Batch Image Processing in Your Browser">
<meta property="og:description" content="Resize, crop, compress hundreds of images. 100% private, no signup required.">
<meta property="og:image" content="https://imagepipeline.art/og-image.jpg">
<meta property="og:url" content="https://imagepipeline.art">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
```

### 6.3. Schema.org (JSON-LD)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Image Pipeline",
  "applicationCategory": "DesignApplication",
  "operatingSystem": "Any (Browser-based)",
  "url": "https://imagepipeline.art",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
}
</script>
```

### 6.4. Canonical URL

```html
<link rel="canonical" href="https://imagepipeline.art">
```

### 6.5. Google Analytics / Search Console

- Добавить свойство `https://imagepipeline.art` в [Google Search Console](https://search.google.com/search-console).
- Подтвердить через DNS-запись (TXT) или HTML-файл.
- Если нужен Google Analytics — вставить G-tag в `<head>`.

---

## 7. Чек-лист для агента

- [ ] Домен добавлен в Vercel Dashboard (Settings → Domains)
- [ ] Nameservers изменены в Porkbun на `ns1.vercel-dns.com` / `ns2.vercel-dns.com`
- [ ] Дождались propagation (проверили `dig imagepipeline.art`)
- [ ] `https://imagepipeline.art` открывается с зелёным замком
- [ ] `www.imagepipeline.art` редиректит на `https://imagepipeline.art`
- [ ] `http://` редиректит на `https://`
- [ ] Favicon добавлен
- [ ] Open Graph meta-теги добавлены
- [ ] Schema.org JSON-LD добавлен
- [ ] Canonical URL настроен
- [ ] Google Search Console property добавлено
- [ ] Google Analytics подключён (опционально)

---

## 8. Контакты и доступы

| Ресурс | Данные |
|--------|--------|
| Домен | `imagepipeline.art` |
| Регистратор | Porkbun (porkbun.com) |
| Хостинг | Vercel (vercel.com) |
| Проект | `image-pipeline-six` |
| Canonical URL | `https://imagepipeline.art` (non-www) |

---

*Документ составлен: 2026-07-01*  
*Владелец: Maxim Mitenkov (vimark.art)*
