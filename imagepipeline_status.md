# Image Pipeline — Status Summary (2026-07-14)

## Project Info
- **Domain:** `https://imagepipeline.art` (non-www canonical, Vercel nameservers)
- **GitHub:** `github.com/v944/image-pipeline`
- **Stack:** Vite 8 + React 19 + TypeScript 6 + @xyflow/react 12 + Zustand 5 + Tailwind CSS 4
- **Backend:** 16 Vercel Edge Functions + Upstash Redis (KV Free, iad1)
- **i18n:** react-i18next, EN + RU, localStorage persistence (`ip-lang`)
- **Analytics:** GA4 (G-SBTY6HS4T1), conditional on cookie consent
- **Email:** Resend (domain verified)
- **Monitoring:** UptimeRobot (5min intervals on /api/health)
- **Build:** `npx tsc -b && npx vite build`, 0 errors

## What's Done

### Product / Core
- Visual node editor (React Flow @xyflow/react 12), 14 node types: Load, Resize, Crop, Compress, Format, Watermark, Denoise, Emotion, Saturation, Brightness, Contrast, Exposure, Rename, Export
- Pipeline engine with cycle detection, progress tracking, per-file error handling
- ZIP export via Web Worker (CSP-safe, separate chunk)
- Batch processing (runs all images through the same pipeline)
- Skeleton loading state (shimmer animation while JS loads)
- Lazy-loaded FlowEditor (dynamic import + Suspense)

### Freemium / Monetization
- Free tier: 10 files/batch, 4 nodes/pipeline, 10 batches/day (sliding window via KV)
- Pro ($10 USDT) / Lifetime ($30 USDT) — TRC-20 only
- TxID verification via TronScan API **with Trongrid fallback**, 90-day dedup, rate limited (5/min/IP, 10 attempts/session/day)
- Activation timeout UX (2-min timeout → `timeout` status + "Check Activation" button)
- Payment flow: Pricing page → CryptoModal (email field) → TxID input → server verify → syncPlanFromServer
- **Payment confirmation email** via Resend (user provides email in modal; receipt sent on successful verification)
- Fail-open: if API is down, client falls back to localStorage counters
- `/api/crypto/check` endpoint — manually check activation status by sessionId

### UI / UX
- Landing page: hero with demo GIF, CTA «Try it free — no signup», trust badges, "How it works" (3 steps), social proof (PH badge, stats, testimonial), email subscribe form
- Footer badges: Product Hunt (dark) + Launch Llama + Uneed (Launching Soon, dark)
- `/api/subscribe` — email capture → Upstash Redis (KV)
- `/api/subscribers` — admin endpoint (key‑protected) to list all subscribers
- `/api/newsletter` — manual newsletter send via Resend (batches of 10, admin key auth)
- CSP updated: img-src allows producthunt.com, speaktechenglish.com
- Editor layout: sidebar (Files/Nodes/Saved tabs), canvas, header (plan badge + UsageIndicator)
- UsageIndicator: progress bar + daily reset timer + BroadcastChannel cross-tab sync
- Onboarding tour (6 steps), stored in Zustand
- File uploader with drag-drop, file list with status indicators (pending/processing/done/error/blocked)
- **64×64 image thumbnails** in file list (createImageBitmap, 128px max dimension)
- **Drag-to-reorder files** (HTML5 native DnD + Zustand store reorderFiles)
- Node palette with drag-to-canvas — 14 node types
- Per-node settings panel (opens on node select) — **fully translated EN+RU**
- Denoise preview (before/after)
- Emotion preview (before/after with upstream chain processing)
- Saturation preview (before/after with upstream chain processing)
- Preview improvements: 300px thumbnails, hover enlargement, click-to-open compare modal with slider
- FAQ page (/faq) with 12 accordion items + JSON-LD — **translated EN+RU**
- Privacy Policy (/privacy) and Terms of Service (/terms)
- **PWA manifest** + apple-mobile-web-app meta tags
- **Keyboard shortcuts**: Ctrl+Z/Shift+Z (undo/redo), Ctrl+Enter (process), Del/Backspace (remove node, skips inputs)
- **Language switcher** (EN/RU toggle) in landing page header + editor header
- **MiniMap** — bird's-eye view of the pipeline on canvas
- **Localhost dev mode** — auto-unlock all features (plan: lifetime) when running locally
- **Desktop shortcut** — one-click launch of local dev server with logo icon

### Icon
- `public/icon.ico` — 256x256 PNG-based ICO (converted from logo.png)

### i18n (EN + RU)
- react-i18next with JSON resource files
- `src/i18n/en.json` and `src/i18n/ru.json` — all user-facing strings
- `LanguageSwitcher` component — toggles `localStorage("ip-lang")` + `i18n.changeLanguage()`
- Landing page: hero, features, CTA, footer
- Editor: header (plan badge, save/process), sidebar tabs, file uploader, file list
- Node palette: all 14 node labels + descriptions
- **Node settings**: all labels, hints, options, placeholders for all 14 node types
- **Node canvas names**: translated label set on node creation (click palette + drag-drop)
- **Settings panel header**: translated title + close button
- **BaseNode subtitle**: translated node type (was raw English `"load"`/`"resize"`)
- **MiniMap**: shows node structure (fixed — added explicit width/height to flowNodes)
- Pricing page: plan names, features, "Popular", "Current Plan"
- CryptoModal: amount/plan/network/txId/email labels, all status messages (verified/checking/not-found/timeout/receipt)
- Processing modal: progress, completion, free limit reached
- FAQ: all 12 questions and answers
- Cookie banner: consent text, accept/necessary buttons
- Privacy & Terms pages: navigation, titles
- Usage indicator: usage text, reset timer

### Security / Privacy
- All processing 100% client-side (no image uploads)
- CSP headers in `vercel.json` (strict)
- HSTS, X-Frame-Options, Referrer-Policy
- Path traversal sanitisation (while-loop for `..` )
- XSS sanitisation for watermark text + rename pattern
- Blob URL lifecycle management (revoke after use)
- Zero-dimension crop guard
- No PII collected, anonymous analytics only (POST /api/event, rate 100/min, GA4 conditional on consent)
- fail-open everywhere (API failures don't break the app)

### Backend / API
- **16 Edge Functions** deployed on Vercel
- Rate limiting with abuse logging (KV keys `abuse:{IP}:{limitType}` with 30d TTL)
- **TronScan → Trongrid fallback** in `/api/crypto/verify`
- **`/api/crypto/check`** — activation status check by sessionId
- **`/api/crypto/receipt`** — payment confirmation email via Resend
- `/api/health` supports HEAD requests (for UptimeRobot)
- 90-day TxID deduplication across all endpoints

### Deployment
- Domain `imagepipeline.art` registered on Porkbun, Vercel nameservers
- Automated deploy: `vercel --prod` (zero-downtime)
- `www` → non-www 301 redirect
- All env vars set: KV, USDT, CRON, APP_URL, RESEND_API_KEY, RECEIPT_FROM_EMAIL, VITE_GA_MEASUREMENT_ID

### SEO / Discovery
- Google Search Console: domain verified (DNS TXT record), sitemap submitted
- `robots.txt` — Allow all, sitemap link
- `sitemap.xml` — 5 URLs (/, /faq, /pricing, /privacy, /terms)
- OG tags: title, description, image (og-image.jpg 1200×630), canonical URL
- Twitter card: summary_large_image
- JSON-LD: SoftwareApplication (homepage) + FAQPage (/faq)
- README on GitHub with badges, features, tech stack, setup instructions

### Pages
| URL | Content |
|-----|---------|
| `/` | Landing page (hero, features, CTA, pricing section) |
| `/editor` | Visual pipeline editor |
| `/pricing` | Free / Pro ($10) / Lifetime ($30) with USDT payment |
| `/faq` | 12 accordion questions, JSON-LD — EN+RU |
| `/privacy` | Privacy Policy |
| `/terms` | Terms of Service |

### Monitoring
- **UptimeRobot** monitors `/api/health` every 5 minutes
- Rate limiting abuse tracked in KV with 30-day retention

### Testing
- 46 tests (Vitest + happy-dom + node-canvas)
- Prototype pollution, XSS vectors, format safety, pipeline engine, ZIP, crypto
- All passing

## Not Done / Gaps

### Promotion / Growth
- No Product Hunt listing
- No Show HN / Indie Hackers post
- No Twitter/X presence
- No blog posts (Dev.to / Medium)
- No referral program
- No submission to directories (G2, Capterra, etc.)

### Features
- No per-image configuration (all images share one pipeline)
- No Stripe/fiat option (intentional — crypto-only)
- No subscription billing (only one-time Pro/Lifetime)
- No CSP nonce (acceptable — SPA without SSR)
- No blog or changelog

## Key Files Reference

| File | Purpose |
|------|---------|
| `api/` | 16 Edge Functions |
| `api/_shared/kv.ts` | REST KV client (get/set/del/incr/expire/ttl/zadd/zcard/zremrangebyscore) |
| `api/crypto/verify.ts` | TxID verification with TronScan + Trongrid fallback |
| `api/crypto/check.ts` | Activation status check by sessionId |
| `api/crypto/receipt.ts` | Payment confirmation email via Resend |
| `api/health.ts` | Health endpoint (HEAD support for UptimeRobot) |
| `api/check-limit.ts` | Rate limits + abuse logging (30d TTL) |
| `src/i18n/config.ts` | i18next init + setLanguage() |
| `src/i18n/en.json` | English translations (~310 keys) |
| `src/i18n/ru.json` | Russian translations (~310 keys) |
| `src/core/canvas/emotion.ts` | Emotion filter — 5 color matrices (Neutral/Joy/Sadness/Calm/Tension) + intensity lerp |
| `src/core/canvas/saturation.ts` | Saturation adjustment via HSL |
| `src/components/pipeline/EmotionPreview.tsx` | Live before/after preview for Emotion node |
| `src/components/pipeline/SaturationPreview.tsx` | Live before/after preview for Saturation node |
| `src/components/pipeline/preview-utils.ts` | Upstream chain processing utility for previews |
| `src/components/pipeline/CompareModal.tsx` | Comparison modal with slider for before/after preview |
| `src/components/pipeline/PreviewImage.tsx` | Preview image with hover enlargement |
| `src/core/canvas/brightness.ts` | Brightness adjustment |
| `src/core/canvas/contrast.ts` | Contrast adjustment |
| `src/core/canvas/exposure.ts` | Exposure adjustment |
| `src/components/layout/LanguageSwitcher.tsx` | EN/RU toggle button |
| `src/components/pipeline/NodeSettings.tsx` | Per-node settings panel, all i18n'd |
| `src/components/pipeline/NodePalette.tsx` | Node palette with translated labels |
| `src/lib/analytics.ts` | GA4 module (conditional on cookie consent) |
| `src/lib/thumbnail.ts` | createImageBitmap thumbnail (128px max) |
| `src/hooks/useVerifyTrc20.ts` | 2-min timeout polling |
| `src/stores/pipeline.store.ts` | Nodes, edges, undo/redo snapshots |
| `src/stores/files.store.ts` | File list, thumbnails, reorder |
| `src/components/onboarding/OnboardingTour.tsx` | 6-step guided tour (i18n'd) |

## Env Variables (required for deploy)

| Key | Description |
|-----|-------------|
| `KV_REST_API_URL` | Upstash Redis REST URL |
| `KV_REST_API_TOKEN` | Upstash Redis REST token |
| `APP_URL` | `https://imagepipeline.art` |
| `USDT_ADDRESS` | TRC-20 wallet for payments |
| `USDT_CONTRACT` | USDT TRC-20 contract address |
| `CRON_SECRET` | Secret auth for `/api/cleanup` |
| `RESEND_API_KEY` | Resend API key for email receipts |
| `RECEIPT_FROM_EMAIL` | Sender address for payment receipts |
| `VITE_GA_MEASUREMENT_ID` | Google Analytics 4 measurement ID |

## Next Steps (Priority)

1. **Demo GIF** — ✅ done (deployed to https://imagepipeline.art/demo.gif)
2. **Product Hunt launch** — prepare listing with demo + description
3. **Blog post** — "How I built a client-side batch image processor" (Dev.to / Medium)
4. **Submit to directories** — ✅ AlternativeTo (live), G2, Capterra, SaaSHub — pending
5. **Twitter/X presence** — @imagepipeline account
6. **Per-image config** — different settings per file (optional, post-launch)
7. **Noda Blur/Sharpen** — by user request
8. **Noda Rotate/Flip** — by user request
9. **Onboarding tooltips** — first-visit hints
