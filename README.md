# Image Pipeline

> Batch image processing in your browser. Build visual pipelines with a node editor — resize, crop, compress, convert, watermark, and more. All processing is 100% client-side.

[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)](https://vite.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![React Flow](https://img.shields.io/badge/React_Flow-12-FF0072?logo=react)](https://reactflow.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![Vercel](https://img.shields.io/badge/Vercel-000?logo=vercel)](https://vercel.com)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)

---

## Features

- **Visual node editor** — drag and drop nodes to build custom image pipelines
- **9 node types**: Load, Resize, Crop, Compress, Format, Watermark, Denoise, Rename, Export
- **Batch processing** — run the same pipeline on multiple images at once
- **ZIP export** — download all processed images as a single ZIP
- **100% private** — everything runs in your browser. No uploads, no servers
- **Freemium** — free for basic use (10 files, 4 nodes, 10 batches/day). Pro and Lifetime via USDT (TRC-20)
- **Share pipelines** — export a share link that expires in 7 days
- **No signup required** — just open the editor and start

## Demo

![App screenshot](https://imagepipeline.art/og-image.jpg)

## Getting Started

```bash
git clone https://github.com/v944/image-pipeline.git
cd image-pipeline
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Type-check + build for production |
| `npm run test` | Run test suite (Vitest) |
| `npm run lint` | Run linter (Oxlint) |
| `npm run preview` | Preview production build |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 |
| Build | Vite 8 + Rolldown |
| Language | TypeScript 6 |
| Flow editor | @xyflow/react 12 |
| State | Zustand 5 |
| Styling | Tailwind CSS 4 |
| Icons | Lucide React |
| Animations | Framer Motion |
| ZIP | JSZip (in Web Worker) |
| Backend | Vercel Edge Functions |
| KV Store | Upstash Redis |
| Payments | USDT (TRC-20) via TronScan API |
| CI/CD | Vercel |

## Project Structure

```
api/                        # Vercel Edge Functions (14 endpoints)
  _shared/                  # Shared KV client, response helpers, types
  health.ts                 # Health check + KV connectivity
  event.ts                  # Anonymous analytics
  check-limit.ts            # Rate limiting (sliding window)
  crypto/
    verify.ts               # USDT TxID verification via TronScan
    config.ts               # Wallet address + prices
  pipeline/
    share.ts                # Create share link
    [shareId].ts            # Load shared pipeline
  error.ts                  # Client error ingestion
  cleanup.ts                # Daily cron (3AM)
src/
  components/
    landing/                # Marketing page
    layout/                 # Editor shell (header, sidebar, usage indicator)
    files/                  # File upload + list
    pipeline/               # Flow editor, node palette, settings, denoise preview
    nodes/                  # React Flow node components (BaseNode)
    processing/             # Processing modal + progress
    pricing/                # Pro/Lifetime pricing + crypto payment modal
    onboarding/             # Guided tour
  stores/                   # Zustand stores (user, files, pipeline, ui)
  core/                     # Pipeline engine + canvas operations
  lib/                      # Edge client, sanitize, utils
  types/                    # TypeScript type definitions
```

## API Endpoints

All endpoints are deployed as Vercel Edge Functions at `https://imagepipeline.art/api/`.

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Server health + KV status |
| `POST /api/event` | Anonymous usage event |
| `GET /api/check-limit` | Check rate limit (session-based) |
| `POST /api/crypto/verify` | Verify USDT TRC-20 transaction |
| `GET /api/crypto/config` | Wallet address + current prices |
| `POST /api/pipeline/share` | Create shareable pipeline link |
| `GET /api/pipeline/:id` | Load shared pipeline |
| `POST /api/error` | Report client-side error |
| `GET /api/cleanup` | Cron job (KV cleanup) |

## Deployment

The project is designed for Vercel. Deploy with:

```bash
vercel --prod
```

Required environment variables:

| Variable | Description |
|----------|-------------|
| `KV_REST_API_URL` | Upstash Redis REST URL |
| `KV_REST_API_TOKEN` | Upstash Redis REST token |
| `USDT_ADDRESS` | USDT TRC-20 wallet address |
| `USDT_CONTRACT` | USDT TRC-20 contract address |
| `CRON_SECRET` | Secret for cron endpoint |
| `APP_URL` | Application base URL |

## License

MIT
