# GateKPT.ai

Clean public website for GateKPT.

## Role

This repo is only for the public landing page:

- product story
- videos/media wall
- offer/pricing
- early access
- links to the private desktop MusicOS app

Private creator OS functionality lives in:

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

## Deployment Plan

Use this repo as the future Vercel source for `gatekpt.ai`.

Until Vercel is switched over, the live domain may still deploy from:

`C:\Users\Green Machine\Desktop\no-going-back`
