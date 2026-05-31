# XIV_MASTER.md — Living Architecture Document

> **Single source of truth.** Replaces the original Master Architect Directive.
> Updated: May 2026. Update this file whenever architecture, strategy, or priorities change.

---

## DOCUMENT 1 — STATUS REPORT
### Gap Analysis: Master Architect Directive vs. Current Build

| Directive Item | Status | Notes |
|---|---|---|
| Bimodal 0DTE strategy (Gear 1 long bias / Gear 2 put scalp) | ⚠️ Partial | UI command input defaults to "SPY 0DTE PUT SCALP"; six-factor tiles wired to WS feed. Gear determination logic lives in external Python backend, not yet implemented. |
| Gear Shift math (VWAP anchored volume, put/call skew, 1-min ROC, 3-sigma) | ⚠️ Partial | Frontend hook + UI built: `useGearShift.ts` computes gear (1/2), confidence (0–100), signal (STRONG/MODERATE/WEAK/NEUTRAL), and 6 blow-off triggers from live WS factors. `GearShiftPanel.tsx` displays gear badge, confidence bar, trigger checklist. Python backend quant engine (VWAP anchor, ROC computation, 3-sigma rolling bands) pending. |
| $10M execution / slippage guard (25% tranches) | ⚠️ Partial | Frontend state machine built: `useTrancheExecution.ts` — 4 × $2.5M tranches, staggered price limits (+0–3bps phase-in), per-tranche PENDING/QUEUED/SUBMITTED/FILLED/CANCELLED states, slippage guard at 5bps. `GearShiftPanel.tsx` surfaces tranche rows with Submit buttons and Cancel All. Backend execution integration (order routing, fill confirmation) pending. |
| Avis PTSD filter (gamma squeeze hard stand-down) | ⚠️ Partial | UI panel + hook built. Shared WS context ✓ Built — `GreenMachineContext.tsx` wires one WS instance across all GM components; `AvisFilterPanel` reads live factors directly. Python backend enforcement ⚠️ Partial — spec written in `AVIS_FILTER_PYTHON.md`, implementation pending in Python backend. |
| PC Engine (real-time Greeks, 500ms heartbeat) | ⚠️ Partial | Greeks panel (delta, gamma, theta, vega) renders in the dashboard. `/api/pc-engine` voice relay route exists. Greeks are from simulated backtest data only; no live computation. No 500ms ping/pong heartbeat — reconnect on close (2.5 s) exists but is not the same thing. |
| PC Historian (1993–2026 dataset, inflection point labeling) | ✗ Not started | Equity curve UI is built (lightweight-charts). Five mock data points (2001, 2008, 2020, 2024, 2026). No real data pipeline, no 1993-present dataset, no inflection-point labeling. |
| WebSocket contract (API_CONTRACT.md spec) | ⚠️ Partial | Protocol is fully implemented in `usePcWebSocket.ts` (9 message types). `MacControlDeck` references `API_CONTRACT.md` in its UI copy. The markdown file itself **does not exist** in the repo. |
| Institutional UI (tape, risk metrics, equity curve) | ⚠️ Partial | Options tape table ✓, risk metrics tiles ✓, equity curve ✓, Greeks panel ✓ — all UI components built and styled. All connected to mock / backtest-simulated data, not live market feed. |
| Nexus home screen / daily system | ✓ Built | `DailyMode` (time-based mode, quick-actions), `GreenMachineSnapshot` (live sigma from WS), four domain widgets (Pit, Studio, Arena, Forge), Three.js XIV scene, Jarvis voice, ElevenLabs morning briefing. |

---

## DOCUMENT 2 — NEW LIVING MASTER DOCUMENT

---

# XIV One System — Architecture & Strategy Reference

> *"The system is designed so that on days you don't trade, Nexus still serves you.
> The edge comes from discipline, not pressure."*

---

## 1. System Overview

**XIV One System** is a unified personal operating environment. Trading is one domain — not the identity.

| App | Role | URL / Port |
|---|---|---|
| **Nexus** | Home screen, daily flow, domain router | localhost:3001 / `gatekpt.vercel.app` |
| **Green Machine** | Execution engine, strategy monitor, Mac control deck | localhost:3001/green-machine + FastAPI :8000 |
| **GateKPT** | Audio AI: streaming chat, voice transcription, Whisper | localhost:3001/gatekpt |
| **Mind Map** | Strategic thinking, visual planning | localhost:3001/map |

**Philosophy:** Balanced life. Trading is one of four domains (Market, Arena, Studio, Mind). The system respects that and routes your attention by time of day. Capital preservation is the only non-negotiable.

---

## 2. Current Architecture

### Frontend — Next.js 14 Hub (`xiv-nexus-dashboard`)

```
src/
├── app/
│   ├── page.tsx                  Nexus home (Dashboard)
│   ├── green-machine/page.tsx    Green Machine full view
│   ├── gatekpt/page.tsx          GateKPT audio AI
│   ├── map/page.tsx              Mind map
│   └── api/
│       ├── assistant/            GateKPT OpenAI streaming chat
│       ├── elevenlabs/           ElevenLabs TTS briefing
│       ├── pc-engine/            Voice command relay to PC
│       └── transcribe/           Whisper transcription
├── components/
│   ├── Dashboard.tsx             Main Nexus layout + XIV scene
│   ├── DailyMode.tsx             Time-aware greeting + quick-actions
│   ├── GreenMachineSnapshot.tsx  Live σ / skew snapshot on home
│   ├── HubNav.tsx                Navigation bar
│   ├── JarvisVoice.tsx           Wake-word voice interface
│   ├── MorningBriefing.tsx       ElevenLabs TTS briefing button
│   ├── XIVScene.tsx              Three.js XIV mark (volatility-driven)
│   ├── ErrorBoundary.tsx         Per-widget fault isolation
│   └── widgets/
│       ├── PitWidget.tsx         Trading: skew + put/call ratio
│       ├── StudioWidget.tsx      Music domain
│       ├── ArenaWidget.tsx       Physical domain
│       └── ForgeWidget.tsx       Build domain
├── green-machine/
│   ├── GreenMachineDashboard.tsx Full command center: tape, equity, risk
│   ├── MacControlDeck.tsx        Kill switch, handshake, six-factor tiles
│   ├── greenMachineApi.ts        Axios client → /gm-api proxy
│   └── usePcWebSocket.ts         Full WebSocket hook (9 message types)
├── gatekpt/
│   ├── Chat.tsx                  Streaming chat component
│   └── GatekptHome.tsx           GateKPT page shell
├── hooks/
│   └── useGreenMachineLive.ts    Nexus home: live σ/skew/PCR from WS
└── lib/
    ├── intentClassifier.ts       Voice command intent routing
    ├── siteUrl.ts                Prod vs preview URL helper
    └── toast.tsx                 Toast notification system
```

### Backend — FastAPI Green Machine (`../Green-Machine/`)

- **Separate repo.** `cursor_backend_sync.py` serves on `:8000`.
- Exposes: `/api/backtest`, `/api/alert` (Telegram), `/api/mac/simulate-handshake`, `/ws/feed`.
- The Next.js hub proxies all `/gm-api/*` requests to `GREEN_MACHINE_BACKEND_URL`.

### WebSocket Protocol (`usePcWebSocket.ts`)

All messages are JSON `{ type, ts?, payload }`.

| Direction | Message Type | Meaning |
|---|---|---|
| Client → Server | `client.hello` | Register as `mac_control` |
| Server → Client | `server.welcome` | Assigns `sessionId` |
| Server → Client | `factors.snapshot` | Full six-factor state |
| Server → Client | `factors.update` | Incremental factor patch |
| Server → Client | `kill_switch.state` | Armed / triggered state |
| Server → Client | `connection.status` | PC feed health |
| Server → Client | `handshake.request` | Trade approval request (>$2.5M) |
| Client → Server | `kill_switch.set` | Arm / disarm |
| Client → Server | `kill_switch.trigger` | Emergency halt |
| Client → Server | `handshake.response` | Approve / deny trade |

> **Note:** `API_CONTRACT.md` is referenced in the UI but not yet committed. Create it.

### Deployment

| Target | Method | Notes |
|---|---|---|
| Local | `npm run dev` | Hub on :3001 |
| Local (full stack) | `npm run dev:all` | Hub + FastAPI concurrently |
| Windows | `start.bat` | Two terminal windows |
| Mac / Linux | `./start.sh` | Hub + API in one terminal |
| Fly.io | `fly deploy` | `fly.toml` + `Dockerfile` in repo root |
| Vercel | `git push main` | `vercel.json` + Node 20 |

CI: `.github/workflows/` runs `npm run verify` (lint → typecheck → build).

---

## 3. Green Machine Strategy

### Philosophy

Capital preservation first. Every parameter exists to protect the account, not maximize it.

### 3.1 Bimodal 0DTE System

The strategy has exactly two modes. The system does not blend them.

**Gear 1 — Long Bias**
- Conditions: VWAP hold, low put/call skew, 3-sigma within bands, tape speed normal.
- Instrument: SPY 0DTE calls.
- Posture: patient, size discipline, scale into strength.

**Gear 2 — Put Scalp**
- Conditions: VWAP breakdown, elevated skew, accelerating tape, 1-min ROC negative.
- Instrument: SPY 0DTE puts.
- Posture: surgical, fast entry, pre-defined exit, no averaging down.

The gear state is a **binary output** of the six-factor model. There is no "between gears."

### 3.2 Six-Factor Model

Each factor is computed in the Python backend and streamed via WebSocket to the Mac control deck.

| Factor | Signal | Gear 1 / Gear 2 Threshold |
|---|---|---|
| **VWAP** | Price vs. VWAP (anchored to open) | Above → G1 / Below → G2 |
| **ROC** | 1-minute rate of change | Positive → G1 / Negative → G2 |
| **3-sigma** | Price deviation in sigma units | ≤ 1.5σ → G1 / > 2.5σ → G2 |
| **Tape speed** | Options flow velocity | Normal → G1 / Accelerating → G2 |
| **Skew** | Put/call IV differential | Flat/negative → G1 / Elevated → G2 |
| **GEX** | Gamma exposure (dealer positioning) | Positive → G1 / Negative → G2 |

### 3.3 Kill Switch

The kill switch is a hard stop. When triggered:
- All pending orders are cancelled at the PC engine.
- No new entries until manually re-armed.
- Reason is logged with timestamp.

Accessible from the Mac Control Deck in one click. Always armed during live trading.

### 3.4 Handshake Gate (>$2.5M Notional)

Any trade exceeding $2,500,000 notional requires a manual `Approve trade` click on the Mac Control Deck. The PC engine queues the order, sends a `handshake.request` over WebSocket, and waits. Denial cancels the order. This gate is not bypassable in software.

For a $10M account under the 25% tranche rule, this gate fires on every single tranche entry. *(Tranche execution logic: pending implementation.)*

---

## 4. What's Built

A complete, deployable hub with institutional-grade UI surfaces. Every component below is in production-ready TypeScript/React.

### Nexus Home Screen
- Time-aware daily mode (`DailyMode.tsx`): Morning Protocol → Focus Block → Market Hours → Arena → Studio.
- Domain quick-actions, live Green Machine sigma snapshot.
- Three.js XIV mark pulsing with real-time volatility from WebSocket feed.
- Jarvis wake-word voice interface with intent classification.
- ElevenLabs morning briefing TTS.
- Four domain widgets: Pit (trading), Studio (music), Arena (physical), Forge (build).

### Green Machine Command Center
- Full options tape table: timestamp, ticker, side, premium, delta, IV, severity.
- Equity curve with `lightweight-charts`: responsive, dark, institutional.
- Greeks panel: delta, gamma, theta, vega, VaR 1D, VaR 10D, confidence.
- Strategy command input (⌘K shortcut), backtest trigger, status log.
- Telegram alert dispatch.
- Alert log drawer with 30-entry history.

### Mac Control Deck
- WebSocket connection manager (URL override, reconnect, disconnect).
- Kill switch with arm/disarm/trigger + optional reason field.
- Handshake queue: approve / deny trade buttons, notional display, session ID.
- Six-factor monitor tiles: VWAP, ROC, 3-sigma, tape speed, skew, GEX — with status colors (ok / warn / alert).

### Avis PTSD Filter
- `useAvisFilter.ts`: computes CLEAR / WATCH / CAUTION / STAND_DOWN signal from 5 squeeze indicators (GEX, ROC, tape speed, skew inversion, sigma fuel).
- `AvisFilterPanel.tsx`: pre-trade UI panel with pulsing STAND_DOWN badge, GEAR 2 BLOCKED stamp, expandable factor checklist, and inline 2021 Avis context note.
- Wired into `GreenMachineDashboard.tsx` between command input and metric tiles. **Live factors from shared WS context — no prop drilling, no mock data.**
- `GreenMachineContext.tsx`: React Context providing one shared `usePcWebSocket` instance to all Green Machine components. `GreenMachineProvider` wraps the page. `useGreenMachine()` hook for consumers.
- `src/app/api/gear-check/route.ts`: Next.js API route exposing gate status and thresholds for backend polling and audit.
- `AVIS_FILTER_PYTHON.md`: Full Python backend spec — 5 indicators, thresholds, `AvisStandDownError`, `avis.signal` WebSocket broadcast, audit logging checklist.

### WebSocket Infrastructure
- `usePcWebSocket.ts`: 9-message protocol, auto-reconnect (2.5 s), session tracking.
- `useGreenMachineLive.ts`: Nexus home pulls sigma, skew, put/call ratio live from WS feed.
- `greenMachineApi.ts`: Axios client proxied through `/gm-api` to FastAPI backend.

### GateKPT Audio AI
- Streaming chat with `ReadableStream` (OpenAI GPT-4).
- Whisper transcription (`/api/transcribe`).
- Persistent chat history (localStorage, last 40 messages).
- Abort mid-stream support.

### Infrastructure
- `next.config.mjs`: `/gm-api/*` proxy rewrites to `GREEN_MACHINE_BACKEND_URL`.
- `fly.toml` + `Dockerfile` + `.dockerignore`: standalone Next.js container for Fly.io.
- `vercel.json`: framework preset for Vercel.
- `.github/workflows/`: CI lint + typecheck + build on Node 20.
- `start.bat` / `start.sh` / VS Code tasks: one-command launch on any machine.
- `AGENTS.md`: multi-machine + multi-agent operating agreement.

---

## 5. What's Next — Prioritized Backlog

Priority is ordered by: safety first, then accuracy, then capability.

### P0 — Safety & Correctness

1. **`API_CONTRACT.md`** — Commit the WebSocket message spec as a formal document. Referenced in UI but missing. Unblocks any future backend developer.

2. **Avis PTSD Filter** ⚠️ Partial — `useAvisFilter.ts` + `AvisFilterPanel.tsx` built and wired to live factors. (a) ✓ Shared WS context: `GreenMachineContext.tsx` provides one WS instance; `AvisFilterPanel` calls `useGreenMachine()` directly — no prop drilling. (b) Historical calibration of THRESHOLDS against real squeeze data: pending. (c) Python backend gate (`AvisStandDownError`, `avis.signal` broadcast): spec written in `AVIS_FILTER_PYTHON.md` — implementation pending in Python backend.

3. **500ms Heartbeat Monitor** — Upgrade the current "reconnect on close" logic to an active ping/pong. If no `pong` received within 500ms, surface a `FEED STALE` banner on the Mac Control Deck and block new entries until feed is confirmed alive.

### P1 — Strategy Engine

4. **Gear Shift Math (Python backend)** ⚠️ Frontend done — Implement the actual six-factor computation in Python:
   - VWAP anchored to market open, volume-weighted, updated on each 1-minute bar.
   - 1-minute ROC: `(close[t] - close[t-1]) / close[t-1]`.
   - 3-sigma: rolling 20-bar standard deviation, classify deviation.
   - Tape speed: options flow count per 30-second window vs. 20-period average.
   - Skew: IV differential between equidistant put/call strikes at 30Δ.
   - GEX: sum of `gamma × open_interest × 100` across all SPY option strikes.
   - Output: a single `gear` enum (`G1` / `G2`) + all six raw values via WebSocket.
   - Frontend: `useGearShift.ts` + `GearShiftPanel.tsx` ✓ built.

5. **Slippage Guard / Tranche Execution** ⚠️ Frontend done — Backend execution integration:
   - `useTrancheExecution.ts` state machine ✓ built (4 × $2.5M, 5bps slippage guard, staggered price limits).
   - `GearShiftPanel.tsx` tranche UI ✓ built (Submit per tranche, Cancel All, handshake gate note).
   - Remaining: backend order routing, fill confirmations, 15-second interval enforcement, fill log.

### P2 — Data & History

6. **Real Historical Data Pipeline** — Build Python ingestion from a free or paid source (CBOE for options history, Yahoo Finance / FRED for equities back to 1993). Store in SQLite or Parquet. Expose `/api/history?symbol=SPY&from=1993-01-01` to the backtest engine. Replace mock equity curve with real simulation.

7. **Inflection Point Labeling** — For the equity curve, identify and label historically significant dates (1987, 2000, 2008, 2020, 2022). Render as markers on the chart with tooltip annotations.

### P3 — Live Trading

8. **Greeks Calculator (Real-time)** — Compute delta/gamma/theta/vega from live IV and price feed using Black-Scholes / Heston. Stream computed Greeks over WebSocket. Replace mock Greeks in the dashboard with live values.

9. **P&L Tracking (Real, Not Simulated)** — Connect to broker API (IBKR or Tradier). Pull real fills, compute real P&L, update equity curve with actual account data. Distinguish simulated backtest curve from live curve in the UI.

10. **LLM Integration for Pattern Recognition** — Feed historical factor snapshots + gear states to a language model. Ask: "What market regimes preceded today's factor configuration?" Surface 3–5 analogues on the Mac Control Deck as context cards (e.g., "Similar to Oct 2008 — 3 of 6 factors align").

### P4 — Polish

11. **`API_CONTRACT.md` formal spec** — Full typed schema for every WS message, with examples. Add to `AGENTS.md` as a required read for any backend contributor.

12. **Mobile layout for Mac Control Deck** — Currently desktop-optimized. Add a minimal mobile view for quick kill-switch access from phone.

13. **Toast → Notification history** — Persist toast events to localStorage, surface as a notification feed on Nexus home.

### May 2026 — Year 1 foundation shipped

The following backlog items were completed in the `year1/green-machine-foundation` batch:

- ✅ **P0 #1 — `API_CONTRACT.md`** formal spec committed as **v1.1**, covering `seq`, heartbeat, bearer auth, `avis.signal`, `kill_switch.reset`, `putCallRatio` factor (DEC-013).

- ✅ **P0 #3 — Heartbeat monitor** — `client.ping` / `server.pong` every 5 s (configurable). Missed pong → `degraded` state surfaced by `ConnectionIndicator`; 3 missed → force-reconnect with jittered exponential backoff (DEC-001).

- ✅ **P4 #11 — `API_CONTRACT.md` full typed schema** — every v1.1 message type documented with payload tables and client behaviour notes.

- ✅ **P2 #6 — Historical data pipeline** — `backend/python/gm_ingest/` with DuckDB-over-Parquet storage, idempotent manifest, ORATS/Polygon/Norgate/FRED adapters (stubbed with `TODO(year-1)` contracts), csv_fixtures source for CI, full test suite.

- ✅ **Backtest engine** — `backend/python/zero_dte/` deterministic engine with `(seed, config, data_version)` triple, `replay` CLI, `runs/golden_2024_q1/` golden file.

- ✅ **Pit widget live data** — mock `setInterval` random walk removed; `PitWidget` reads from `useGreenMachineLive()` via the shared WS provider; env-configurable threshold colours; stale indicator; 60-min sparkline.

- ✅ **Observability** — pino structured logging (Node server + browser), `/admin/runs`, `/admin/connections` server pages, `gm_admin.py` reference endpoints, WS message logging gated by `NEXT_PUBLIC_GM_LOG_LEVEL`.

Remaining from §5 backlog:

- 🔲 **P0 #2** — Avis PTSD Filter server-side gate (`AvisStandDownError`, Python backend implementation; frontend and `avis.signal` client handling done)
- 🔲 **P1 #4** — Gear Shift Math Python backend
- 🔲 **P1 #5** — Slippage Guard backend order routing
- 🔲 **P3 #8–10** — Greeks, live P&L, LLM pattern recognition
- 🔲 **P4 #12–13** — Mobile layout, notification history

---

## 6. Deployment Reference

### Environment Variables

| Variable | Purpose | Required |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for OG / metadata | Prod only |
| `ELEVENLABS_API_KEY` | Morning briefing TTS | Optional |
| `ELEVENLABS_VOICE_ID` | ElevenLabs voice | Optional |
| `PC_ENGINE_URL` | Voice relay target | Optional |
| `GREEN_MACHINE_BACKEND_URL` | FastAPI origin for `/gm-api` | Required for backend |
| `NEXT_PUBLIC_GM_WS_URL` | WebSocket endpoint for live feed | Optional |
| `OPENAI_API_KEY` | GateKPT Whisper + chat | Required for GateKPT |

### Launch Commands

```bash
# Hub only
npm run dev

# Hub + FastAPI (requires Green-Machine repo adjacent)
npm run dev:all

# Before pushing
npm run verify      # lint → typecheck → build

# Fly.io
fly deploy --build-arg GREEN_MACHINE_BACKEND_URL=https://your-api.fly.dev

# Vercel
git push origin main   # auto-deploys via GitHub integration
```

### URL Migration

Old GateKPT standalone paths (`/gatekpt-site/*`, `/gate-kpt/*`) redirect permanently to `/gatekpt`.

### Machine Checklist (Pull + Run on New Machine)

1. `node --version` → must be 20.x
2. `cp .env.example .env.local` → fill required keys
3. `npm install`
4. `npm run dev`
5. For full stack: ensure `../Green-Machine/cursor_backend_sync.py` exists, then `npm run dev:all`

---

## 7. Operating Principles

**Capital preservation is the only non-negotiable.** The kill switch is always one click away. The handshake gate is not a suggestion.

**The system is designed so that on days you don't trade, Nexus still serves you.** The daily flow, GateKPT sessions, Mind Map, and Arena tracking have value independent of whether the market is open.

**The edge comes from discipline, not pressure.** Gear 2 is not triggered by FOMO. It is triggered by the six-factor model meeting quantitative thresholds. Human override exists only to stand down, not to override the filter in the other direction.

**One system, four domains.** Market, Arena, Studio, Mind. Each deserves its time. The time-aware Nexus home enforces this by design.

**Every machine runs the same contract.** `npm run verify` before push. No exceptions. CI enforces it.

---

*Last updated: May 2026. Maintained in `xiv-nexus-dashboard` root.*
