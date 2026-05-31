# ROADMAP.md — Green Machine Year-by-Year

> Consolidates the multi-phase plans already published across `XIV_MASTER.md`
> §5, `ZERO_DTE_SPEC.md` §17 (Z0–Z8), `HISTORICAL_DATA_SPEC.md` §13 (D0–D6),
> and `FUND_REPLICATION_SPEC.md` §13 (F0–F7) into one ordered scope per
> calendar year. This file is the entry point the brief asks contributors
> (and Cowork) to load.
>
> When the brief or a spec doc shifts a phase across years, edit this file —
> not the individual spec — so Year-N scope stays a single source of truth.

---

## Year 1 — Foundation (this batch)

**Theme:** make the deck live, the backend safe, the backtest reproducible,
and the docs followable. No outside capital. No real broker. Capital
preservation is achieved by *not yet* connecting capital.

### Year 1 acceptance gates (from the brief)

- Open the deck on any machine, data is live, no mocks.
- A backtest run on Monday produces identical numbers on Friday.
- Backend can be killed and restarted without the deck crashing.
- All tests pass in CI.
- A new contributor follows `docs/year1/RUNBOOK.md` and is running in < 30 minutes.
- The Forge no longer shows "Green Machine — WS handshake QA" outstanding.
- `docs/year1/` has CURRENT_STATE, GAP_ANALYSIS, EXECUTION_PLAN, DATA_SCHEMA, RUNBOOK, TROUBLESHOOTING, DECISIONS.

### Year 1 work, in dependency order

1. **WS handshake QA** — `API_CONTRACT.md` v1.1 (seq, jittered backoff, heartbeat, bearer auth, `avis.signal`), single shared connection, `ConnectionIndicator`, integration + load tests. *Maps to: `XIV_MASTER.md` §5 P0 #3; `API_CONTRACT.md` §10 v1.1.*
2. **FastAPI backend hardening (Next edge + Python spec)** — bearer auth, rate limits, RFC 9457 problem+json, correlation IDs, real `/health`, `/metrics`. *Maps to: `FUND_REPLICATION_SPEC.md` §6, §9; `API_CONTRACT.md` §10.*
3. **Observability scaffolding** — pino + structlog, admin pages. *Maps to: `FUND_REPLICATION_SPEC.md` §8 middle-office.*
4. **Pit widget live wiring** — drop mocks, threshold colours, stale indicator, sparkline. *Maps to: `XIV_MASTER.md` §4 Nexus widgets; `ZERO_DTE_SPEC.md` §12.3.*
5. **Historical data ingest, 2020→present** — DuckDB-over-Parquet, validation gates, idempotent CLI, `DATA_SCHEMA.md`. *Maps to: `HISTORICAL_DATA_SPEC.md` D0–D3 partially (D4 events on the edge of Year 1).*
6. **Zero-DTE backtest engine (deterministic, seeded, replayable)** — engine module, golden-file smoke test, `runs/` reproducibility metadata, `replay` CLI. *Maps to: `ZERO_DTE_SPEC.md` Z0–Z3; `HISTORICAL_DATA_SPEC.md` §9–§10.*
7. **Docs + onboarding** — README pass, RUNBOOK, TROUBLESHOOTING, CHANGELOG. *Maps to: brief Task 7.*

### Year 1 explicitly *out* of scope

- Live broker order routing (Year 2+; `XIV_MASTER.md` §5 P3 #9).
- Pre-2020 historical data (Year 2; `HISTORICAL_DATA_SPEC.md` notes).
- Greeks calculator wired to live IV (Year 2; `XIV_MASTER.md` §5 P3 #8).
- LLM pattern-recognition cards (Year 2; `XIV_MASTER.md` §5 P3 #10).
- Capacity work, ramp tracker, parity monitor (Year 3 / `FUND_REPLICATION_SPEC.md` F0–F3).

---

## Year 2 — Accuracy

**Theme:** the numbers on the deck are *real* numbers from real options
markets, computed by the same engine that runs backtests.

- `HISTORICAL_DATA_SPEC.md` D4 (`market_events` + chart markers).
- `HISTORICAL_DATA_SPEC.md` D5 (Polygon intraday → Gear 2 enabled).
- `XIV_MASTER.md` §5 P3 #8 — real-time Greeks from live IV.
- `ZERO_DTE_SPEC.md` Z4–Z6 — GEX live + Avis Python backend + regime detection.
- `ZERO_DTE_SPEC.md` Z7 — full 0DTE surface on the deck + voice commands.
- Pre-2020 backfill if data licensing permits.

### Year 2 acceptance gates (forward-looking)

- The deck's Greeks panel reads from live IV (`engine_version` recorded on each tile).
- A backtest result carries a green credibility header per `HISTORICAL_DATA_SPEC.md` §1.
- Avis filter live in Python, enforced before any Gear 2 entry.

---

## Year 3 — Operation

**Theme:** the system survives an LJM/Volmageddon-scale shock unattended, and
can show its work to an auditor.

- `FUND_REPLICATION_SPEC.md` F0–F2 — capacity, staged ramp, portfolio risk.
- `FUND_REPLICATION_SPEC.md` F3 — backtest↔live parity monitor.
- `FUND_REPLICATION_SPEC.md` F4 — algo slicing + implementation shortfall.
- `XIV_MASTER.md` §5 P3 #9 — real P&L from broker fills.
- `HISTORICAL_DATA_SPEC.md` D6 — latency model + tranche fills + DataShop/Databento.

### Year 3 acceptance gates (forward-looking)

- A pilot-live stage has been completed (90+ trading days) before any
  scale-up tranche.
- Parity header has been green throughout the pilot.
- Daily three-way reconciliation runs clean.

---

## Year 4+ — Capital (gated by external counsel)

- `FUND_REPLICATION_SPEC.md` F5 — compliance hooks, pre-trade gates.
- `FUND_REPLICATION_SPEC.md` F6 — performance + investor reporting.
- `FUND_REPLICATION_SPEC.md` F7 — back-office reconciliation + exports.
- `XIV_MASTER.md` §5 P4 — polish (mobile, notifications).

This year is **gated by `FUND_REPLICATION_SPEC.md` §0.1** — no outside
capital before the securities attorney, fund administrator, auditor, and
compliance consultant are engaged. The software being ready is necessary,
not sufficient.

---

## Cross-year operating principles (from `XIV_MASTER.md` §7)

- **Capital preservation is the only non-negotiable.** No year ships
  capability that loosens this; each year tightens it.
- **One system, four domains.** Trading is one of four. Year-N scope
  doesn't claim more of Marcelo's attention than the time-aware Nexus
  protocol gives it.
- **The edge comes from discipline, not pressure.** Year-N scope is "what
  the brief asked for *in that year*" — no scope creep, no smuggling Year-N+1
  work into Year-N because we have the capacity.
- **Every machine runs the same contract.** `npm run verify` before push,
  every year, no exceptions.

---

*Maintained at repo root. Update alongside any phase plan in `XIV_MASTER.md`,
`ZERO_DTE_SPEC.md`, `HISTORICAL_DATA_SPEC.md`, or `FUND_REPLICATION_SPEC.md`
that shifts work across years.*
