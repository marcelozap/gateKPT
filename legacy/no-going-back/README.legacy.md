# Gatekpt Hub — Nexus shell (`no-going-back`)

Next.js **14** Jarvis-style dashboard for **gatekpt**: dark glass UI, **Framer Motion**, **Web Speech** wake word (**Jarvis**), **ElevenLabs** morning briefing, domain widgets, central **Three.js** mark pulsing with volatility.

## What this repo is

**Nexus** is the **dashboard shell** at `/` — navigation, voice routing to your PC engine, briefing, and widgets.

Product lanes stay **intentionally separate** so assistants and backends do not blur together:

| Lane | Route | Role |
|------|--------|------|
| **Green Machine** | `/green-machine` | Markets · backtests · FastAPI-backed deck (`/gm-api` → `GREEN_MACHINE_BACKEND_URL`) |
| **GateKPT** | `/gatekpt` | Music / studio UI + `/api/transcribe` & `/api/assistant` |
| **Mind map** | `/map` | Nexus layer graph |

Standalone apps (e.g. **Rally**) live in **their own repos**; link them from marketing / portfolio — no need to merge codebases here.

## Run

```bash
cd no-going-back   # repo root (same folder as package.json)
npm install
npm run dev
```

Opens **http://localhost:3001** (see `package.json` `dev` script). Use **Chrome or Edge** for Web Speech on Nexus.

## Stay in sync (PC, laptop, Cursor)

Your shell on the PC may differ from Cursor’s; the **contract** is still **`package.json` scripts** and **Node 20**.

1. **Node** — Use **20** (`.nvmrc` / `.node-version`) so you match **GitHub Actions** and typical Vercel images.
2. **Package manager** — Standardize on **npm** for this repo. After `npm install`, commit **`package-lock.json`** when it changes so every machine and CI resolve the same tree.
3. **Secrets** — `.env.local` is per machine and gitignored. When you pull updates, check **`.env.example`** for new keys.
4. **Before push** — `npm run verify` (lint + typecheck + build). Same checks run in CI.
5. **Agents** — See **`AGENTS.md`** for a short checklist Cursor and collaborators can follow.
6. **Fly.io** — **`fly.toml`** and **`Dockerfile`** live in the **repo root** (same folder as `package.json`). Pull on every machine before **`fly deploy`** so configs stay aligned.

**Green Machine API** (backtest, alerts, WS, simulate-handshake): run Python backend on port **8000** (e.g. `python3 cursor_backend_sync.py` from the Green-Machine repo). The hub rewrites **`/gm-api/*`** to `GREEN_MACHINE_BACKEND_URL` (default `http://127.0.0.1:8000`).

**GateKPT** transcription + chat: set **`OPENAI_API_KEY`** in `.env.local` (optional; UI loads without it but those actions error until configured).

## Deploy (Vercel)

`vercel.json` pins the **Next.js** framework preset. Use **Node 20** (matches `engines` in `package.json`).

### Option A — Use **gatekpt.vercel.app** for this hub

1. Open the **gatekpt** project in the [Vercel dashboard](https://vercel.com/dashboard) (the one whose Production URL is [gatekpt.vercel.app](https://gatekpt.vercel.app)).
2. **Settings → Git** → connect **this** repository (`marcelozap/no-going-back`). Confirm **Root Directory** is the app root (folder that contains `package.json`).
3. **Settings → Environment Variables → Production** — add at least:

   | Name | Example / note |
   |------|------------------|
   | `NEXT_PUBLIC_SITE_URL` | `https://gatekpt.vercel.app` |
   | `OPENAI_API_KEY` | Required for GateKPT transcribe + chat in production. |
   | `GREEN_MACHINE_BACKEND_URL` | **Public** `https://…` origin of your FastAPI server (Vercel cannot reach `127.0.0.1`). |
   | `NEXT_PUBLIC_GM_WS_URL` | Optional; use **`wss://…`** to your WS endpoint if the Mac deck should work from the browser. |
   | `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` | Optional; for Nexus briefing TTS. |
   | `PC_ENGINE_URL` | Optional; Nexus voice relay. |

4. **Deployments → Redeploy** the latest Production build (or push to `main`).

Previews can leave **`NEXT_PUBLIC_SITE_URL`** unset so Open Graph uses **`https://${VERCEL_URL}`** automatically (`src/lib/siteUrl.ts`).

### Option B — New Vercel project

[Import the repo](https://vercel.com/new) → Framework **Next.js** → add the same variables. Set **`NEXT_PUBLIC_SITE_URL`** to your production URL (or rely on `VERCEL_URL` until you attach a custom domain).

### Production vs local Green Machine

Server-side **`/gm-api`** rewrites call **`GREEN_MACHINE_BACKEND_URL` from Vercel’s network**, not from the visitor’s laptop. Your FastAPI process must listen on a host the internet can reach (or a tunnel), with **HTTPS** if you use an `https://` rewrite target.

## Deploy (Fly.io)

If your other machine already uses **`fly.toml`**, this repo now includes the same style of layout so you can **`git pull`** and run **`fly deploy`** from the app root.

1. **Install** the [Fly CLI](https://fly.io/docs/hands-on/install-flyctl/) (`flyctl` / `fly`).
2. **Rename the app** if `app = "xiv-nexus-dashboard"` in **`fly.toml`** is taken: `fly apps create <name>` then edit **`fly.toml`** → `app = "<name>"`.
3. **Build-time URLs** — `next.config.mjs` bakes **`/gm-api`** rewrites (and optional **`NEXT_PUBLIC_SITE_URL`**) when **`npm run build`** runs inside Docker. Set them for the image build, for example:
   - `fly deploy --build-arg GREEN_MACHINE_BACKEND_URL=https://<your-fastapi-host> --build-arg NEXT_PUBLIC_SITE_URL=https://<your-fly-app>.fly.dev`
   - or add a **`[build.args]`** table in **`fly.toml`** (only for **non-secret** URLs you are okay committing).
4. **Runtime secrets** (API keys, etc.): `fly secrets set OPENAI_API_KEY=...` (and any other vars from **`.env.example`** your routes read at **runtime**).
5. **Ports** — Local dev uses **3001**; the container listens on **3000** (**`internal_port`** in **`fly.toml`**), which matches the **standalone** image in **`Dockerfile`**.

Files: **`fly.toml`**, **`Dockerfile`**, **`.dockerignore`**, and **`output: "standalone"`** in **`next.config.mjs`**.

## Environment (`.env.local`)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SITE_URL` | Canonical `https://…` for OG / `metadataBase` (optional on Vercel; see Deploy) |
| `ELEVENLABS_API_KEY` | Server TTS (`/api/elevenlabs`) |
| `ELEVENLABS_VOICE_ID` | Optional ElevenLabs voice id |
| `PC_ENGINE_URL` | Optional `POST` target for Nexus voice → PC |
| `GREEN_MACHINE_BACKEND_URL` | FastAPI origin for `/gm-api` rewrite |
| `NEXT_PUBLIC_GM_WS_URL` | WebSocket URL for Green Machine deck (default `ws://<host>:8000/ws/feed`) |
| `OPENAI_API_KEY` | GateKPT Whisper + assistant routes |

Without ElevenLabs keys, **Play briefing** returns a clear error; the rest of the UI works.

## Voice flow

1. **Start link** → continuous listening.
2. Say **Jarvis**, then your command (or say **Jarvis &lt;command&gt;** in one phrase).
3. Command text is **POST**ed to `/api/pc-engine` → forwarded to `PC_ENGINE_URL` if set.

## Year 1 architecture

The Year 1 foundation batch adds a reliable, testable, and observable data path
between the Green Machine FastAPI backend and the Nexus dashboard:

```
FastAPI (:8000)
  ├─ REST /api/* ──→ Next middleware (auth + rate limit) ──→ /gm-api/* rewrite
  └─ WS /ws/feed ──→ usePcWebSocket (single shared connection via GlobalGreenMachineProvider)
                       ├─ heartbeat (client.ping / server.pong)
                       ├─ seq-based gap / duplicate detection
                       ├─ jittered exponential backoff on disconnect
                       └─ ConnectionIndicator (green/amber/red dot)
```

Key additions:
- **WS protocol v1.1** — `seq` numbering, heartbeat, bearer auth, `avis.signal` (`API_CONTRACT.md`)
- **Auth + rate limiting** — Next edge middleware on `/gm-api/*` and `/admin/*`
- **Backtest engine** — deterministic, seeded, replayable (`backend/python/zero_dte/`)
- **Data ingest** — DuckDB-over-Parquet pipeline (`backend/python/gm_ingest/`)
- **Observability** — pino logger, admin pages at `/admin/runs` and `/admin/connections`
- **Tests** — vitest for TypeScript, pytest for Python

See `docs/year1/RUNBOOK.md` for the full operations guide and `docs/year1/TROUBLESHOOTING.md`
for common issues.

## Stack

- Next 14 App Router, TypeScript, Tailwind
- `@react-three/fiber` + `@react-three/drei` + `three`
- Framer Motion
- vitest (testing)
- pino (structured logging)
# GateKPT Public Web (`no-going-back`)

> **Current role:** this repo deploys the public `gatekpt.ai` website. The repo name is legacy. Treat it as the GateKPT public landing/marketing site plus private XIV web shell routes, not as the primary MusicOS app.

## Current Boundary

| Surface | Path / Route | Current Role |
|--------|---------------|--------------|
| Public GateKPT landing | `/` and `/gatekpt` | Product story, videos, offer/pricing, early access |
| Private XIV shell | `/xiv` | Personal/private OS shell |
| Green Machine | `/green-machine` | Trading/money lane |
| Money Machine | `/money-machine` | Budget/money workflow |
| Desktop MusicOS app | `C:\Users\Green Machine\Desktop\GateKPT-MusicOS` | Real C#/.NET creator OS development |

Going forward, new creator OS functionality belongs in `GateKPT-MusicOS`. This repo should explain, sell, and link to the product.

---
