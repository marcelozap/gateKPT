# GateKPT.ai Deployment Handoff

This repo is the clean public website for `gatekpt.ai`.

## GitHub

- Repo: `marcelozap/gateKPT`
- Branch: `gatekpt-ai-public-site`
- Local path: `C:\Users\Green Machine\Desktop\gatekpt-ai`

The same branch was temporarily pushed to `marcelozap/no-going-back` only as a bridge while the old Vercel project was still connected there.

## Vercel

Preferred setup:

- Project name: `gatekpt-ai`
- Git repository: `marcelozap/gateKPT`
- Production branch: `gatekpt-ai-public-site`
- Framework preset: `Next.js`
- Root directory: `./`
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: leave blank
- Node.js version: `22.x`

Environment variable:

```text
NEXT_PUBLIC_SITE_URL=https://gatekpt.ai
```

Domains:

```text
gatekpt.ai
www.gatekpt.ai
```

If Vercel shows the old Voice Mirror page, the project is deploying the wrong branch. Switch the production branch from `main` to `gatekpt-ai-public-site`, then redeploy.

If Vercel says the domain is already assigned, remove the domain from the old `no-going-back` Vercel project first, then add it to the new `gatekpt-ai` project.

## Legacy Repo

`marcelozap/no-going-back` was the old deployed project. It mixed the public website with XIV, Green Machine, Money Machine, APIs, and private shell routes.

Do not copy the old private routes/API files into this public repo.

Curated legacy notes were preserved in:

```text
legacy/no-going-back
```
