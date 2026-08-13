# GateKPT Project Guidelines

This file is the working standard for the public GateKPT website.

`GATEKPT_GUIDELINES.md` governs the writing and public voice. `CLAUDE.md` gives agents the short operating rules. This file is the detailed source map for the current implementation.

GateKPT is a public AI research and writing site. It explains the system underneath AI and publishes Marcelo's own notes, observations, and experiments.

XIV is the wider creative language: disciplined, cinematic, technical, musical, physical, and human. GateKPT uses that language for an AI research context. It should feel like a field instrument or editorial research terminal, not a generic SaaS site, trading dashboard, or gaming interface.

## Project Location

- Repository: `marcelozap/gateKPT`
- Local worktree: `/Users/a14/gatekpt-ai-public-site-work`
- Production branch: `gatekpt-ai-public-site`
- Public site: `https://www.gatekpt.ai`
- Deployment: Vercel project `gatekpt-ai`

The folder `/Users/a14/Documents/xiv` is a separate trading-GPT archive. Do not edit the GateKPT website from that folder. Do not copy trading content into this public AI site.

## File Map

Edit the source file that owns the behavior. Do not patch generated output or the deployed site directly.

| Need | Edit here | Notes |
|---|---|---|
| Homepage structure | `src/app/page.tsx` | Renders the interactive stack experience and no-script fallback. |
| Interactive homepage behavior | `src/gatekpt/GatekptLanding.tsx` | Client state machine, keyboard controls, swipe behavior, transitions, map overlay. |
| Stack layers and public copy | `src/gatekpt/content.ts` | Single source for layers, English/Spanish copy, field-log entries, and Note 001. |
| Reading-route navigation | `src/components/HubNav.tsx` | Home, Field Log, Latest Note, and language switch. |
| Field Log index | `src/app/log/page.tsx` | Stranger-friendly entry point for published writing. |
| Field Log entry route | `src/app/log/[slug]/page.tsx` | Use only for writing that is intentionally exposed through the log. |
| Spanish Field Log | `src/app/es/log/page.tsx` and `src/app/es/log/[slug]/page.tsx` | Keep navigation and structure parallel to English. |
| Long-form note | `src/app/notes/<slug>/page.tsx` | Main reading page for a note. Use normal document scrolling. |
| Note social card | `src/app/notes/<slug>/opengraph-image.tsx` | Satori/Next image route for LinkedIn, Slack, and social previews. |
| Site-wide visual system | `src/app/globals.css` | Colors, typography, layout, responsive rules, instrument mode, reading mode. |
| Root metadata and fonts | `src/app/layout.tsx` | Site title, description, metadata base, fonts, icons. |
| Site URL logic | `src/lib/siteUrl.ts` | Keep production metadata on `https://www.gatekpt.ai`. |
| Public images and audio | `public/` | Use stable filenames. Reference through `/filename.ext`. |
| Deployment settings | `next.config.mjs`, `vercel.json`, `DEPLOYMENT_HANDOFF.md` | Change only when deployment behavior really needs it. |

Current important assets:

- `public/gatekpt-field-log-hero.png`: editorial Field Log hero image.
- `public/gatekpt-icon.png`: raster site icon.
- `src/app/icon.svg`: browser icon variant.
- `public/audio/gatekpt-night-guitar-preview.mp3`: existing audio asset.

Do not edit `.next/`, `.vercel/`, `node_modules/`, deployment output, or generated type files as a design or content source.

## Content Ownership

The public site should show Marcelo's writing only.

- New writing starts as a content object in `src/gatekpt/content.ts`.
- A published note needs a stable slug, title, date, summary, body, and citation/source treatment when relevant.
- The Field Log must not present placeholder, invented, or inherited sample entries as Marcelo's published work.
- Planned ideas may exist in private planning documents, but they should not appear in the public Field Log until there is real writing behind them.
- English and Spanish structures should remain parallel. Do not silently translate or invent a Spanish version of a personal note; label the language honestly.
- Keep social-post copy and the full website note related but distinct. LinkedIn can be the short hook; the website can hold the complete thought.

For Note 001, the canonical public route is:

`https://www.gatekpt.ai/notes/wall-e`

The old `/notes/the-only-thing-paying-attention` route is retained as a redirect for previously shared links. Do not remove it without checking existing posts and metadata.

## Visitor Experience

A stranger should understand the site within one screen.

The first screen should answer:

1. What is GateKPT?
2. What can I read now?
3. Where can I explore the AI stack?

Required navigation behavior:

- `Home` returns to the stack map.
- `Field log` shows only published writing.
- `Latest note` goes directly to the current featured note.
- `ES` and `EN` switch language without hiding the main destination.
- The homepage `Read latest note` action goes to the note itself, not to an empty archive.
- Every reading page can return to the stack map.
- A link shared on LinkedIn must open the exact post, not the homepage.

Do not make visitors decode labels such as `L01-L07`, `Note 001`, or `Field Log` without nearby context. Technical labels can remain as secondary metadata, but the primary heading must say what the page is about.

## XIV Visual Standard

### Core feeling

The visual direction is cinematic editorial technology:

- deep blue-black or near-black atmosphere
- cyan as the primary signal color
- restrained magenta in the atmosphere, not as noisy foreground decoration
- small amber accents for value, attention, or important actions
- wet glass, reflective surfaces, subtle grain, thin structural lines
- strong negative space and clear subject separation
- focused, independent, intelligent, quietly powerful

The visual reference may suggest a lone artist-engineer moving through an international city at night, carrying research, music, and training into the same life. These signals should be natural and sparse: a tablet, headphones, tennis equipment, transit light, or data reflections. Do not turn the interface into a prop collage.

### What it must not become

- gaming fantasy or anime
- a crowded cyberpunk dashboard
- military, tactical, or weapon imagery
- trading, crypto, finance-hype, or price-target imagery
- generic coding screens
- startup marketing language
- oversized holograms or decorative neon
- beige editorial bands that break the dark atmosphere
- gradients used as the main content treatment
- decorative blobs, orbs, bokeh, or floating shapes

### Color and contrast

Use the existing CSS variables in `src/app/globals.css` before adding new colors:

- `--void`: page background
- `--ink`: focal text
- `--ink-soft`: readable supporting text
- `--ink-dim`: low-priority metadata
- `--visor`: primary cyan action/signal
- `--amber`: cost, value, date, or attention accent
- `--green`: completion, validation, or trust
- `--rust`: limited atmospheric warmth

Rules:

- Color belongs mostly in atmosphere; contrast belongs to the content.
- Keep saturated accents rare. They should guide attention, not decorate every element.
- Do not encode meaning by color alone.
- Never use low-contrast text just to make the interface feel more mysterious.
- One primary action per meaningful state or page.
- Use borders, spacing, and hierarchy before adding another color.

### Typography

- Inter: UI, navigation, supporting copy, controls.
- JetBrains Mono: labels, dates, layer IDs, metadata, counters, technical chrome.
- Newsreader/serif: long-form note titles and reading body.
- Mono is interface language, not long paragraphs.
- Long-form prose should stay around 19px with approximately 1.7 line height and a readable measure near 68ch.
- Keep display headings large only when they describe the page-level idea.
- Do not use negative letter spacing.

### Layout

- One main idea per viewport.
- Use a clear reading path from heading to explanation to action.
- Prefer full-width bands and unframed layouts; use borders only when they clarify a tool or repeated item.
- Keep radii at 2px or less.
- Use 1px structural borders and restrained shadows; avoid floating-card piles.
- Design mobile as a first-class experience. Navigation must remain readable without horizontal mystery scrolling.
- Keep text inside its container at every width.

## Instrument Mode And Reading Mode

The homepage is an instrument. Notes and Field Log pages are reading routes. They have different rules.

Instrument mode:

- The homepage uses a fixed state machine rather than a scrolling landing page.
- One state presents one idea.
- Advance is intentional: click, keypress, or swipe.
- Scroll is blocked only while the instrument is mounted.
- The main frame should remain anchored while content changes.
- Motion should clarify state changes, not provide spectacle.

Reading mode:

- Notes and Field Log pages use normal document scrolling.
- Reading pages can use a sticky navigation bar and a footer.
- Serif body typography is appropriate for long-form writing.
- Citations and source context should be visible near the relevant work.
- Never allow instrument overflow rules to leak into reading routes.

## State-Machine Guardrails

These are coupled behaviors. Preserve them when editing `src/gatekpt/GatekptLanding.tsx` or its CSS.

- `FADE = 130` in `GatekptLanding.tsx` must match the `.gki-slot.out` transition duration in `globals.css`.
- The visor animation retriggers through `key={sweep}`. Do not replace it with a simple class toggle; React may batch the class change and the animation will stop without an error.
- Navigation handlers must ignore input while `fading` is true. A second keypress during the transition can otherwise create a state that looks complete but has not recorded the intended action.
- `body.gk-instrument` owns `overflow: hidden`. It is added and removed by the homepage component. Never move this behavior onto bare `body` or a shared reading layout.
- The homepage's wheel and touch handlers are deliberate. Do not remove them unless the interaction model is being redesigned intentionally.
- Keep the `<noscript>` stack fallback in `src/app/page.tsx`. The interactive homepage needs a crawlable, readable fallback.

Before simplifying an interaction, reproduce it with click, keyboard, rapid input, mobile swipe, and reduced-motion settings.

## Code And Dependency Rules

- Follow the existing Next.js App Router structure.
- Prefer the existing CSS system and local components over new frameworks.
- Keep dependencies small. Do not add an animation library for effects CSS already handles.
- Use semantic HTML and accessible names for links, buttons, regions, figures, and navigation.
- Use `next/image` for project images when appropriate.
- Use `apply_patch` for manual edits.
- Keep comments short and explain only non-obvious coupling.
- Avoid unrelated refactors, formatting churn, and line-ending changes.
- Do not expose secrets from `.env.local` in source, docs, screenshots, or commits.

## Image And Asset Rules

- Use real or generated bitmap imagery when the page needs a visual anchor.
- A project-bound generated image must be copied into `public/` and referenced by code; do not leave it only in a tool cache.
- Do not add text, logos, or watermarks to generated imagery unless explicitly requested.
- Keep subject matter editorial and relevant to the page. An image should reveal the page's world, not act as generic atmosphere.
- Preserve useful existing assets unless replacement is intentional.
- Use stable, descriptive filenames such as `gatekpt-field-log-hero.png`.

## Verification Workflow

From `/Users/a14/gatekpt-ai-public-site-work`:

```bash
npm run lint
npm run typecheck
npm run build
```

Before committing:

1. Run `git status --short`.
2. Run `git diff --check`.
3. Review the diff for unrelated changes, generated files, and line-ending churn.
4. Test the changed route directly.
5. Check the mobile layout when navigation or content hierarchy changes.
6. Verify canonical and Open Graph metadata for any new note route.

For a site change, verify at minimum:

- `/`
- `/log`
- `/notes/wall-e`
- `/es`
- `/es/log`
- the old note redirect if a slug changed

## Publishing

The production deployment uses the `gatekpt-ai-public-site` branch and the domains:

- `https://gatekpt.ai`
- `https://www.gatekpt.ai`

Keep `NEXT_PUBLIC_SITE_URL=https://www.gatekpt.ai` configured in Vercel. After a social-preview change, deploy first and run the live URL through LinkedIn Post Inspector before posting. Social scrapers cache aggressively.

Do not call a change finished just because it builds locally. Confirm the live route, status, visible content, canonical URL, and social image when relevant.

## Definition Of Done

A change is ready when:

- a stranger can tell what the page is and what to do next;
- the public copy is Marcelo's actual writing or clearly labeled interface copy;
- the page follows the XIV/GateKPT visual standard;
- instrument and reading mode remain separate;
- keyboard, touch, and reduced-motion behavior still work where relevant;
- `lint`, `typecheck`, and `build` pass;
- the diff is scoped and reviewed;
- the live route has been checked after deployment.
