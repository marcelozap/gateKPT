# Changelog

All notable changes to `xiv-nexus-dashboard` (the Nexus hub + Green Machine
deck) are recorded here. Format loosely follows [Keep a Changelog]; entries
since the Year 1 foundation batch use **conventional-commit** prefixes so the
log doubles as a changelog source.

## [Unreleased] — Year 1 foundation (`year1/green-machine-foundation`)

### feat

- **WS protocol v1.1** — `seq` numbering, gap/duplicate/out-of-order detection,
  jittered exponential backoff (capped at `GM_RECONNECT_MAX_MS`), `client.ping`/
  `server.pong` heartbeat, `client.snapshot_request` for after-gap recovery.
- **Single shared WS connection** — `GlobalGreenMachineProvider` in root layout
  replaces the dual-connection pattern (DEC-010).
- **ConnectionIndicator** — 8px dot (green/amber/red/grey) with tooltip showing
  state + last message timestamp.
- **Next edge middleware** — bearer auth (`GM_API_TOKEN`), rate limits (per-IP +
  per-token), RFC 9457 `problem+json` errors, `X-Request-ID` correlation IDs.
- **Health + metrics routes** — `/api/gm-health` (composite), `/api/gm-metrics`.
- **Zero-DTE backtest engine** — deterministic `(seed, config, data_version)`,
  session arc, entry checklist, NBBO fills, `replay` CLI, golden-file test.
- **Historical data ingest** — DuckDB-over-Parquet pipeline, validation gates,
  idempotent CLI, CSV-fixture source adapter, vendor stubs.
- **Pit widget live wiring** — env-driven skew/ratio thresholds, stale indicator,
  SVG sparkline (last 60 min), honest "—" when backend hasn't adopted v1.1.
- **Observability** — pino logger with redaction, admin pages (`/admin/runs`,
  `/admin/connections`), Python `gm_admin.py` reference endpoints.
- **Long-term regime layer (DEC-017)** — 2-to-3-year trend classifier
  (BULL/BEAR/CHOP/VOLATILE/TRANSITION/UNKNOWN) in `backend/python/green_machine/`,
  Next API stub with inline fallback at `/api/gm-regime`, `LongTermRegimePanel`
  mounted above the Avis filter, pure `regimeGate.decide()` helper that
  combines intraday gear vote + long-term regime → effective gear + size
  multiplier. Tests on both sides. New script `npm run gm:regime`.

### docs

- `docs/year1/CURRENT_STATE.md` — snapshot at branch cut.
- `docs/year1/GAP_ANALYSIS.md` — per-task gap inventory.
- `docs/year1/EXECUTION_PLAN.md` — file-level change list + dependency order.
- `docs/year1/DECISIONS.md` — DEC-001 through DEC-016.
- `docs/year1/DATA_SCHEMA.md` — full data layer schema documentation.
- `docs/year1/RUNBOOK.md` — operations guide (< 30 min onboarding).
- `docs/year1/TROUBLESHOOTING.md` — common failure modes and fixes.
- `docs/year1/DONE.md` — final summary + acceptance gate status.
- `ROADMAP.md` — Year 1–4+ scope consolidation.
- `CHANGELOG.md` — this file.
- `README.md` — Year 1 architecture section added.
- `AGENTS.md` — WS v1.1 contract + test conventions.
- `API_CONTRACT.md` bumped to v1.1.

### test

- vitest + `@vitest/ui` added as test runner (DEC-004).
- WS protocol codec + seq analysis unit tests.
- WS state machine transition tests.
- Middleware auth, rate limit, problem+json, correlation tests.
- PitWidget rendering + threshold + stale indicator tests.
- Mock WS server (`__mocks__/ws-mock-server.ts`) for integration tests.
- Load test script (`scripts/ws-loadtest.mjs`).

### refactor

- `useGreenMachineLive` — thin shim reading from `GlobalGreenMachineProvider`
  instead of owning a second WS connection.
- `GreenMachineContext` — delegates to global provider.
- `PitWidget` — removed `setInterval` random walk; reads from live props.
- Removed fabricated put/call ratio from GEX (DEC-014).

## [0.1.0] — pre-Year-1

The repo as of May 2026 before the Year 1 foundation batch: Next 14 hub,
Green Machine UI surface with mocked data and a fixed-backoff WS client,
no test framework. See `docs/year1/CURRENT_STATE.md` for the full snapshot.

[Keep a Changelog]: https://keepachangelog.com/en/1.1.0/
