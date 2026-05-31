# Agent / multi-machine notes

Use this file so humans, Cursor, and other automation share the same assumptions.

## Quick start

| Machine | Command | Effect |
|---------|---------|--------|
| Any | `npm run dev` | Hub only (port 3001) |
| Any | `npm run dev:all` | Hub + Green Machine API together (requires Python backend path `../Green-Machine/`) |
| Windows | double-click `start.bat` | Opens two terminal windows, hub + API |
| Mac/Linux | `./start.sh` | Hub + API in one terminal |

## Canonical commands (npm)

All scripts are defined in `package.json`. Prefer **`npm run <script>`** even if your shell usually uses `pnpm`, `yarn`, or `bun`, so lockfiles and CI stay consistent.

| Script | Purpose |
|--------|--------|
| `npm run dev` | Next dev server on **port 3001** |
| `npm run lint` | ESLint (Next) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run build` | Production build |
| `npm run verify` | **lint → typecheck → build** (run before pushing) |
| `npm start` | Serves `.next` after `npm run build` (default Next port **3000**) |

## Node version

- **Target: Node 20** (see `.nvmrc` and `.node-version`; matches `.github/workflows/ci.yml`).
- `package.json` allows **Node ≥ 18.18** for flexibility; use **20** when possible to match CI and Vercel.

## Environment

- Copy **`.env.example`** → **`.env.local`** on each machine. Never commit `.env.local`.
- When `.env.example` gains a variable, update your local `.env.local` after pulling.

## What belongs in git (shared “forward sync”)

These are intentional, not noise:

- **`.github/workflows/`** — CI parity with your machine (`npm run verify`-like steps).
- **`vercel.json`** — Vercel framework preset.
- **`fly.toml`** + **`Dockerfile`** + **`.dockerignore`** — Fly.io / Docker deploy on your PC (same contract as CI: `npm run verify` before push).
- **`src/lib/siteUrl.ts`** — Production vs preview URL logic for metadata.
- **`.env.example`** — Documented env contract (no secrets).

## Related repos

- **Green Machine API**: Python FastAPI ([Green-Machine](https://github.com/marcelozap/Green-Machine)), not this Next app.
- **Rally**: standalone product ([Rally](https://github.com/marcelozap/Rally)); linked from Nexus nav, not embedded here.
- **Deploy / gatekpt**: see `README.md` → Deploy (Vercel) or Deploy (Fly.io).

**Positioning**: **Nexus** (`/`) is the dashboard shell. **GateKPT** is the music OS lane: voice, songs, recordings, creative practice, and vocal workflow. **Green Machine** is the private money/trading lane: budget automation, active trade watch, market alerts, and Telegram/Garmin notifications. Keep the lanes separate in copy, prompts, APIs, and UX; Telegram defaults to Green Machine unless the user explicitly uses `/music` or `/gatekpt`.

## WS contract

The WebSocket protocol is **v1.1** as of the Year 1 batch. See `API_CONTRACT.md` for the full spec.

Key additions over v1.0:
- `seq` field on every server-pushed message (monotonic per session)
- `client.ping` / `server.pong` heartbeat
- Bearer auth via `?token=` query param on the WS URL
- `avis.signal` message type
- `kill_switch.reset` message type

## Tests

- **TypeScript tests** live in colocated `*.test.ts(x)` files or `__tests__/` directories under `src/`.
- **Python tests** live in `backend/python/tests/`.
- Runner: `vitest` for TS, `pytest` for Python.
- Run all TS tests: `npm test`
- Run Python tests: `cd backend/python && pytest`
- Commit messages follow **conventional commits** (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`).

## Green flags before merge

1. `npm run verify` passes locally.
2. `npm test` passes.
3. No secrets in commits (grep for `sk-`, API keys).
4. If you use **npm**, commit **`package-lock.json`** after install so dependency trees match CI.
5. Commit messages follow conventional commits.
