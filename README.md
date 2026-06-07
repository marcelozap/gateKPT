# GateKPT.ai

Public website for GateKPT: a browser-safe music visualizer/playground and an honest doorway into an evolving private MusicOS experiment.

## Role

This repo is for the public landing page and lightweight demo experience:

- product story
- free browser visualizer demo
- videos/media later
- plain-language project context
- links to the private desktop MusicOS app when it is ready

GateKPT's public promise is simple: make music technology feel playable, less intimidating, and easier to start.

Do not oversell the private app. The public website should connect first and impress later.

## Current Direction

The website should open with the landing page first, not a full-screen visualizer. Visitors should quickly understand:

- GateKPT is about free creative music technology.
- The browser demo requires no download, account, or audio upload.
- The deeper C#/.NET MusicOS app is private and still experimental.
- Current public value is the visualizer, tone, and creative world.

The current product direction is documented in:

`PRODUCT_PLAN.md`

Private creator OS functionality, recording experiments, and workflow development live in:

`C:\Users\Green Machine\Desktop\GateKPT-MusicOS`

Trading/Green Machine functionality stays out of this repo.

## Routes

- `/` public landing page
- `/gatekpt` public landing page alias for old links

## Development

```powershell
npm install
npm run dev
```

Local URL:

`http://localhost:3001`

## Build

```powershell
npm run verify
```

`verify` runs lint, TypeScript, and production build.

## Deployment

Vercel should deploy this repo from the production branch that contains the Next.js landing page.

Recommended production source:

- GitHub repo: `marcelozap/gateKPT`
- Branch: `main`
- Framework: `Next.js`
- Root directory: `./`
- Build command: `npm run build`

If the live domain shows the old Voice Mirror full-screen demo, Vercel is attached to the wrong branch or an old project.

## Legacy Archive

Selected planning docs from the old `no-going-back` and Voice Mirror work are preserved for reference. They are not the public homepage experience.

Relevant technical references include:

- `CONTROL_PROTOCOL.md`
- `ABLETON_PLUGIN_PLAN.md`
- `VISUAL_APP_PLAN.md`
- `MACBOOK_PC_DEPLOYMENT_PLAN.md`
- `INDUSTRY_BUILD_SPEC.md`
