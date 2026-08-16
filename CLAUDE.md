# GateKPT Project Instructions

Read these before writing copy, posts, or code in this repo.

## Standards

1. `docs/standards/GATEKPT_GUIDELINES.md` governs voice, content pillars, posting rules, and banned words.
2. `docs/standards/PROJECT_GUIDELINES.md` governs the current codebase, design system, routes, assets, and architecture.
3. `docs/ops/CONTENT_RUNBOOK.md` is the procedure for publishing a note, adding a log entry, editing a layer, or renaming a slug. Read it before touching `src/gatekpt/content.ts`.
4. `GATEKPT_HANDOFF.md`, `docs/standards/GATEKPT_DESIGN_STANDARD.md`, and `XIV_BRAND_STANDARD.md` may provide historical or extended context when present. If one is absent from the repo, do not invent its contents; use `docs/standards/PROJECT_GUIDELINES.md` as the current source of truth.

## Non-negotiables

- `src/gatekpt/content.ts` is the current source of truth for the seven layers, in this order: Input, Tokens, Context, Models, Tools, Chips, Power. (The old Power/Chips/Data/Models/Software/Testing/Business order is retired — see `docs/training/00_READ_FIRST.md`. `src/gatekpt/stack.ts` still contains it and is dead code: zero imports.) Any list of layers in a post, meta description, OG image, noscript block, or homepage copy must match it exactly and in order.
- Every number gets a source. No placeholder figures in production.
- English and Spanish structures stay in sync. Do not invent a Spanish version of personal writing and present it as Marcelo’s words.
- There are two layout modes only: Instrument and Reading. Instrument has no scroll and a fixed anchor. Reading uses normal document scroll and serif body text. Never mix them.
- `body.gk-instrument` owns `overflow: hidden`. Never put that rule on bare `body` or a shared reading layout.
- Use one primary accent: visor cyan `#7DF9FF`, under 5% of pixels. Neon does not touch text except for one intentional magenta phrase per screen.
- No hype. Aim at the condition, never the person.

## Before shipping copy

- The first line survives LinkedIn’s roughly 140-character truncation.
- Layer names match `src/gatekpt/content.ts`.
- There is no more than one question.
- The copy does not repeat what the image already says.
- No banned words from `docs/standards/GATEKPT_GUIDELINES.md` appear without a deliberate reason.

## Before changing the homepage

- Preserve the state-machine interaction in `src/gatekpt/GatekptLanding.tsx`.
- Keep `FADE = 130` synchronized with the `.gki-slot.out` CSS transition.
- Keep the visor retrigger keyed by `sweep`.
- Ignore navigation input while `fading` is true.
- Keep the wheel, touch, reduced-motion, and `<noscript>` behaviors unless the interaction model is intentionally redesigned.

## Before committing

```bash
npm run lint
npm run typecheck
npm run build
git diff --check
```

Review the diff for generated files, secrets, unrelated changes, and line-ending churn. Verify the changed route directly and check mobile layout when navigation or content hierarchy changes.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
