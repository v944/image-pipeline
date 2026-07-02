# Image Pipeline — Status Summary (2026-07-01)

## Project Info
- **Domain:** `https://imagepipeline.art` (non-www canonical, Vercel nameservers)
- **GitHub:** `github.com/v944/image-pipeline`
- **Stack:** Vite 8 + React 19 + TypeScript 6 + @xyflow/react 12 + Zustand 5 + Tailwind CSS 4 + Framer Motion
- **Backend:** 14 Vercel Edge Functions + Upstash Redis (KV Free, iad1)
- **Build:** `tsc -b && vite build`, 0 errors

## What's Done

### Product / Core
- Visual node editor (React Flow), 9 node types: Load, Resize, Crop, Compress, Format, Watermark, Denoise, Rename, Export
- Pipeline engine with cycle detection, progress tracking, per-file error handling
- ZIP export via Web Worker (CSP-safe, separate chunk)
- Batch processing (runs all images through the same pipeline)
- Sketelon loading state (shimmer animation while JS loads)

### Freemium / Monetization
- Free tier: 10 files/batch, 4 nodes/pipeline, 10 batches/day (sliding window via KV)
- Pro ($10 USDT) / Lifetime ($30 USDT) — TRC-20 only
- TxID verification via TronScan API, 90-day dedup, rate limited (5/min/IP, 10 attempts/session/day)
- Payment flow: Pricing page → CryptoModal → TxID input → server verify → syncPlanFromServer
- Fail-open: if API is down, client falls back to localStorage counters

### UI / UX
- Landing page with features, CTA to editor
- Editor layout: sidebar (Files/Nodes tabs), canvas, header (plan badge + UsageIndicator)
- UsageIndicator: progress bar + daily reset timer + BroadcastChannel cross-tab sync
- Onboarding tour (7 steps), stored in Zustand
- File uploader with drag-drop, file list with status indicators (pending/processing/done/error/blocked)
- Node palette with drag-to-canvas
- Per-node settings panel (opens on node select)
- Denoise preview (before/after)

### Security / Privacy
- All processing 100% client-side (no image uploads)
- CSP headers in `vercel.json` (strict)
- HSTS, X-Frame-Options, Referrer-Policy
- Path traversal sanitisation (while-loop for `..` )
- XSS sanitisation for watermark text + rename pattern
- Blob URL lifecycle management (revoke after use)
- Zero-dimension crop guard
- No PII collected, anonymous analytics only (POST /api/event, rate 100/min)
- fail-open everywhere (API failures don't break the app)

### Deployment
- Domain `imagepipeline.art` registered on Porkbun, Vercel nameservers
- Automated deploy: `vercel --prod` (zero-downtime)
- `www` → non-www 301 redirect
- All 6 env vars set: `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `APP_URL`, `USDT_ADDRESS`, `USDT_CONTRACT`, `CRON_SECRET`
- Build optimizations: `.js` extensions for Edge Functions, `declare var process` in API files

### SEO / Discovery
- Google Search Console: domain verified (DNS TXT record), sitemap submitted
- `robots.txt` — Allow all, sitemap link
- `sitemap.xml` — 3 URLs (/, /faq, /pricing)
- OG tags: title, description, image (og-image.jpg 1200×630), canonical URL
- Twitter card: summary_large_image
- JSON-LD: SoftwareApplication (homepage) + FAQPage (/faq)
- README on GitHub with badges, features, tech stack, setup instructions

### Pages
| URL | Content |
|-----|---------|
| `/` | Landing page (hero, features, CTA) |
| `/editor` | Visual pipeline editor |
| `/pricing` | Free / Pro ($10) / Lifetime ($30) with USDT payment |
| `/faq` | 12 accordion questions, JSON-LD |

### Testing
- 46 tests (Vitest + happy-dom + node-canvas)
- Prototype pollution, XSS vectors, format safety, pipeline engine, ZIP, crypto
- All passing

## Not Done / Gaps

### Missing Pages
- No `/privacy` or `/terms` pages (linked in footer placeholder)
- No blog or changelog

### Technical
- TronScan API has no fallback (if down, verify fails; should add Trongrid as backup)
- No monitoring/alerting on KV healthcheck
- No rate limiting logging / abuse tracking
- No CSP nonce (acceptable — SPA without SSR)

### Monetization
- No Stripe/fiat option (intentional — crypto-only)
- No subscription recurring billing (only one-time Pro/Lifetime)
- No activation timeout UX (user stuck if TxID never confirms)

### Promotion / Growth
- No Product Hunt listing
- No Show HN post
- No Twitter/X presence
- No demo GIF/screencast
- No blog posts (Dev.to / Medium)
- No analytics dashboard (only raw KV counters)

### Polish
- No PWA manifest / offline support (editor depends on React Flow, unlikely to work offline)
- No i18n
- No keyboard shortcuts
- No undo/redo for node edits
- No auto-save pipeline drafts
- No image preview thumbnails in file list
- No drag-to-reorder files
- No batch configuration (different settings per image — all images share one pipeline)

## Key Files Reference

| File | Purpose |
|------|---------|
| `api/` | 14 Edge Functions |
| `api/_shared/kv.ts` | REST KV client (get/set/del/incr/expire/ttl/zadd/zcard/zremrangebyscore) |
| `src/stores/user.store.ts` | Plan, usage, BroadcastChannel sync |
| `src/stores/pipeline.store.ts` | Nodes, edges, add/remove node |
| `src/stores/files.store.ts` | File list, status, add/remove |
| `src/stores/ui.store.ts` | UI state (sidebar, onboarding, processing) |
| `src/core/PipelineEngine.ts` | Processing loop, cycle detection |
| `src/lib/edge-client.ts` | API client with exponential backoff |
| `src/lib/sanitize.ts` | XSS + path traversal guard |
| `src/components/processing/ProcessingModal.tsx` | Process flow, limit check, download ZIP |
| `src/components/pricing/CryptoModal.tsx` | TxID input + verification |
| `src/components/layout/UsageIndicator.tsx` | Compact + full usage bar, reset timer |
| `src/components/onboarding/OnboardingTour.tsx` | 7-step guided tour |
| `public/robots.txt` | Robots directive |
| `public/sitemap.xml` | XML sitemap |
| `public/og-image.jpg` | Open Graph preview image |
| `public/favicon.svg` | `IP_icon.svg` |
| `vercel.json` | Headers (CSP/HSTS), rewrites, redirects, cron |
| `index.html` | Meta tags, OG, JSON-LD, skeleton |

## Env Variables (required for deploy)

| Key | Description |
|-----|-------------|
| `KV_REST_API_URL` | Upstash Redis REST URL |
| `KV_REST_API_TOKEN` | Upstash Redis REST token |
| `APP_URL` | `https://imagepipeline.art` |
| `USDT_ADDRESS` | TRC-20 wallet for payments |
| `USDT_CONTRACT` | USDT TRC-20 contract address |
| `CRON_SECRET` | Secret auth for `/api/cleanup` |

## Next Steps (Suggested Priority)

1. **Demo GIF** — 5-10s screencast for GitHub README + Product Hunt
2. **Product Hunt launch** — prepare listing with demo + description
3. **Privacy / Terms pages** — legal requirement if accepting payments
4. **TronScan fallback** — add Trongrid API as secondary verification source
5. **Analytics** — basic dashboard (number of users, verifications, pipeline shares)
6. **Blog post** — "How I built a client-side batch image processor" (Dev.to / Medium)
