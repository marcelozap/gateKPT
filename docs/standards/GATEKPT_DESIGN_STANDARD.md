# GateKPT Design Standard

Version 1.0

This is the design source of truth for GateKPT. It translates the private art direction into a public-safe system for an AI research and learning platform.

## Governing Law

> Color lives in the atmosphere. Contrast stays with the content.

The page can feel cinematic, technical, and alive, but the readable content must stay sharp, sparse, and disciplined. Saturated color belongs behind the work. Foreground text stays near-monochrome.

## Public Identity

GateKPT should read as:

- professional AI research terminal
- interactive learning instrument
- technical field manual
- industry intelligence notebook
- system design workspace

GateKPT should not read as:

- trading signal site
- crypto dashboard
- generic SaaS landing page
- private lore page
- hype blog

## Color System

Use one foreground accent: visor cyan.

```css
:root {
  --void: #05070D;
  --deep: #080C15;
  --panel: #0B111C;

  --visor: #7DF9FF;
  --visor-core: #E4FDFF;
  --visor-deep: #2BA8C4;
  --visor-35: rgba(125, 249, 255, 0.35);

  --neon-magenta: #FF2D95;
  --neon-violet: #8B5CF6;
  --neon-amber: #FFB020;
  --neon-jade: #39FF88;

  --focal: #F4F8FC;
  --near: #93A0B4;
  --chrome: #6B7A94;
  --ghost: #222C40;

  --ok: #4ADE80;
  --miss: #FF6B6B;
}
```

Rules:

- Accent color appears on less than 5 percent of pixels.
- Neon appears in blurred atmosphere only.
- The single exception is one magenta failure phrase per screen.
- Exactly one foreground element should use peak contrast per state.
- Use four text levels: focal, near, chrome, ghost.
- Never encode meaning in hue alone.
- Dark mode is the primary product.

## Property Atmosphere

GateKPT atmosphere:

- violet plus cyan
- cold, technical, analytical
- no warm beige homepage bands
- no colorful foreground category cards

Use amber only when explaining cost, economics, or value. Use green only for completion, validation, or trust.

## Typography

Use:

- Inter for UI and short body text
- JetBrains Mono for labels, counters, IDs, tags, and interface chrome
- Serif only for future long-form reading routes

Rules:

- Mono is chrome, not paragraph text.
- Long-form pages should use a serif body at 19px / 1.7 and max 68ch.
- Display text should stay tight, but not overused.
- No negative letter spacing outside large display headings.

Type scale:

```text
display   clamp(28px, 3.6vw, 44px) / 1.20
figure    clamp(64px, 10vw, 132px) / 0.92
h1        clamp(34px, 3.6vw, 48px) / 1.10
h2        clamp(24px, 2.2vw, 30px) / 1.20
h3        20px / 1.30
body-lg   19px / 1.70
body      17px / 1.65
small     15px / 1.55
label     12px / 1.20 mono uppercase
micro     10px / 1.20 mono uppercase
```

## Layout Rules

- Base spacing unit: 4px.
- Preferred spacing values: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 160.
- Radius: 2px.
- Avoid generic 8px+ SaaS rounding.
- Avoid drop shadows.
- Elevation comes from background lightness and hairline borders.
- Use 1px structural borders.
- One main idea per viewport.
- Prefer 3 choices, 4 layers, or 5 workflow steps.

## Instrument Mode

Use instrument mode for:

- stack trainer
- prompt lab
- calculators
- interactive explainers
- evaluation drills

Rules:

- Fixed anchor: the main content box never moves.
- One idea per state.
- Advance by click, keypress, or swipe.
- Gate teaching moments with a binary choice.
- Two answer options, not four.
- Persistent chrome must be minimal.
- Scroll is blocked only while the instrument is mounted.

## Reading Mode

Use reading mode for:

- weekly briefs
- research notes
- case studies
- career notes
- source-backed explainers

Rules:

- Normal scroll.
- Nav and footer allowed.
- Serif body recommended for long prose.
- Max prose width: 68ch.
- Citations must be first-class.
- Instrument body overflow must not leak into reading pages.

## Motion

Motion budget is small.

- Content changes: opacity only.
- Out: 130ms.
- In: 240ms.
- Hover: border and color only.
- No lift, no scale.
- Atmosphere drift may be slow and desynchronized.
- Visor sweep fires once per state change.
- Full prefers-reduced-motion support is mandatory.

## Components

Panel:

- deep background
- 1px ghost border
- 2px radius
- 24px padding
- hover border brightens only

Button:

- one filled button style
- one text-link style
- avoid two equal primary buttons

Progress:

- segmented bars
- filled visor
- empty ghost

Citation:

- mono superscript marker
- full source list near the relevant content

Callout:

- note, key, caution
- left border only
- no icon clutter

## Voice

Reach for:

- map
- layer
- stack
- anchor
- constraint
- failure mode
- bottleneck
- context
- structure
- economics
- observed
- measured
- sourced

Avoid:

- supercharge
- revolutionary
- game-changing
- secret hack
- trading signal
- alpha
- plays
- buy / sell / calls
- price target
- bags
- positions

Public-safe substitutions:

| Risky | Use |
|---|---|
| trading | market context |
| signals | indicators |
| alpha | insight |
| plays | scenarios |
| price targets | valuation context |
| bags / positions | exposure, only in disclosure |
| buy / sell / calls | coverage or analysis |
| secret prompts | prompting patterns |

## Ship Checklist

- [ ] Accent color stays under 5 percent of pixels.
- [ ] One focal element per state.
- [ ] Text clears contrast requirements.
- [ ] No neon foreground text except one failure phrase.
- [ ] 2px radius.
- [ ] No drop shadows.
- [ ] Opacity-only content transitions.
- [ ] Reduced motion supported.
- [ ] Grain layer present.
- [ ] Instrument routes block scroll only while mounted.
- [ ] Reading routes scroll normally.
- [ ] Every number has a citation.
- [ ] Public-safe language applied.
- [ ] Keyboard path works.
