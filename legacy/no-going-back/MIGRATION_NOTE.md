# No Going Back Migration Note

`no-going-back` was the original mixed web shell. It combined:

- the public `gatekpt.ai` website
- private XIV shell ideas
- Green Machine trading UI/API routes
- Money Machine experiments
- voice / assistant / Telegram routes
- deployment notes for Vercel, Fly.io, Docker, and local desktop usage

The new direction is cleaner:

- `gatekpt-ai` is only the public GateKPT landing page and browser-safe visualizer demo.
- `GateKPT-MusicOS` is the private C#/.NET desktop creator app.
- `Green-Machine` owns trading, Schwab, budget sync, alerts, and market automation.
- Private XIV shell ideas should not live in the public website unless intentionally rebuilt.

## Preserved Here

These files were copied as reference only:

- `README.legacy.md`
- `ROADMAP.legacy.md`
- `XIV_MASTER.legacy.md`
- `CHANGELOG.legacy.md`
- `AGENTS.legacy.md`

They are not part of the running website. They are here so the old repo can be deleted without losing the design history.

## Intentionally Not Migrated

The following were not copied into the public repo:

- `.env.local`
- API routes
- backend code
- Green Machine trading code
- Money Machine code
- Electron/Desktop launcher code
- generated logs/build outputs
- local data folders
- Python strategy/spec files

Those belong in their own private repos or archives, not in the public `gatekpt.ai` website.

## If Something Is Needed Later

Rebuild the idea deliberately in the correct project:

- public marketing or demo: `gatekpt-ai`
- private creator OS: `GateKPT-MusicOS`
- trading/money automation: `Green-Machine`
