# GateKPT Content Runbook

How to publish and edit content on gatekpt.ai without breaking it.

This is the **procedure**. For *what to write*, the standards already exist and this file does not
repeat them:

- `docs/training/00_READ_FIRST.md` — read before any content, design, or navigation change
- `docs/training/journal_entry_standard.md` — the required shape of an entry
- `docs/training/journal_entry_template.md` — the blank to copy
- `docs/training/site_language.md` · `ai_layers_teaching_model.md` · `privacy_and_data_references.md`
- `docs/standards/GATEKPT_GUIDELINES.md` — voice and banned words
- `docs/standards/GATEKPT_DESIGN_STANDARD.md` — visual law

---

## 0. Read this once. It will save you an hour.

**All live content is in exactly one file: `src/gatekpt/content.ts`.**

Three files in `src/gatekpt/` look like content and are **not wired to anything**:

| File | Status | Why it looks real |
|---|---|---|
| `stack.ts` | **dead — 0 imports** | Exports `LAYERS`, `LAYERS_ES`, `LENSES`. Old infrastructure-first taxonomy. |
| `journal.ts` | **dead — 0 imports** | Exports `JOURNAL_ENTRIES`, `getJournalEntries()`. Looks exactly like the API you want. |
| `content.ts` → `logEntriesEn` / `logEntriesEs` | **dead exports inside a live file** | Real entries, correctly typed, never served. `getEntries()` does not return them. |

Editing any of those three changes nothing on the site. This is the single most likely way to waste
an afternoon here.

**Verify before you trust anything:**

```powershell
npm run typecheck            # dead files still typecheck — this does NOT prove wiring
Select-String -Path src\app\**\*.tsx -Pattern "gatekpt/content"   # 8 hits = the live surface
```

### Two taxonomies exist. `content.ts` is the current one.

| | Order |
|---|---|
| **`content.ts` (LIVE, correct)** | Input · Tokens · Context · Models · Tools · Chips · Power |
| `stack.ts` (dead, old) | Power · Chips · Data · Models · Software · Testing · Business |

`00_READ_FIRST.md` settles it: *"Teach from the reader's experience outward… The reader should not
feel like they are being dropped into infrastructure first."* The live order is deliberate and right.
If you find an old primer or note listing Power/Chips/Data/Models/Software/Testing/Business as "the
locked seven," that text is stale — the site moved on and the training packet documents why.

---

## 1. Publish a new note

Notes are the long-form pieces with a bespoke page — `wall-e`, `the-trap-of-time`. This is the
common case.

**Step 1 — draft it** against `docs/training/journal_entry_standard.md`. Do not skip this; the
frontmatter fields there map onto the fields below.

**Step 2 — add the note object** to `src/gatekpt/content.ts`, next to `note002`:

```ts
export const note003 = {
  slug: "your-slug",                       // kebab-case, this becomes the URL
  displayKicker: "NOTE Nº 003",
  title: "Title Case Title",
  description: "One or two sentences. Also used as the meta description and the card summary.",
  publishedTime: "2026-08-20T09:00:00-04:00",   // ISO with -04:00, matches the others
  citation: "Source, dir. Name, Studio, Year.", // optional
  body: [
    { text: "A paragraph." },
    { text: "Another paragraph.", footnote: "1" },
    { text: "A LINE THAT PIVOTS THE ARGUMENT:", kind: "turn" },
    { text: "The closing question." },
  ],
};
```

`body` is `NoteBlock[]`: `{ text, kind?: "paragraph" | "turn", footnote? }`. `kind: "turn"` is the
uppercase pivot line — one per note, at most.

**Step 3 — add the log-entry wrapper** so it appears in the writing list. Model on the existing ones:

```ts
const fieldLogEntryNote003: LogEntry = {
  slug: note003.slug,
  date: "2026-08-20",
  title: note003.title,
  layer: note003.displayKicker,
  summary: note003.description,
  noteHref: "/notes/your-slug",
  body: [ /* 2–3 short paragraphs — the card/list view, not the full note */ ],
};
```

**Step 4 — add the Spanish wrapper** `fieldLogEntryNote003Es` the same way. Translate `title`,
`summary`, `body`. Keep `slug` and `date` identical to the English.

**Step 5 — register it.** This is the step people forget. In `getEntries()`:

```ts
export function getEntries(locale: Locale) {
  return locale === "es"
    ? [fieldLogEntryNote003Es, fieldLogEntryNote002Es, fieldLogEntryEs]
    : [fieldLogEntryNote003,   fieldLogEntryNote002,   fieldLogEntryEn];
}
```

**Newest first — the array order is the display order.** Nothing sorts by date for you.

**Step 6 — create the page** at `src/app/notes/your-slug/page.tsx`. Copy
`src/app/notes/the-trap-of-time/page.tsx` and swap `note002` → `note003`. Do not write it from
scratch; that file carries the metadata and OG wiring.

**Step 7 — ship** (section 6).

---

## 2. Add a short entry with no bespoke page

If it does not need its own designed page, you only need steps 3, 4 and 5 above — the `LogEntry`
wrapper pair plus the `getEntries()` registration. `/log/[slug]` renders it generically and
`/notes/[slug]` is an alias of the same component.

Omit `noteHref` when there is no bespoke page — that field is what makes a card link out to one.

---

## 3. Edit the learning layers

The seven layers on the homepage instrument live in `layersEn` and `layersEs` in `content.ts`.

```ts
{
  id: "L01",
  name: "Input",
  essence: "One sentence. Plain words.",
  fig: "1",                    // the big number
  unit: "ask",                 // its unit
  figcap: "What the number means.",
  src: "Publisher, Title",     // required
  srcUrl: "https://…",         // required — every number has a citation
  brk: "Setup. <em>The failure phrase in em tags.</em>",
  details: ["Bullet one.", "Bullet two.", "Bullet three."],
}
```

Rules that are enforced by review, not by the compiler:

- **`src` and `srcUrl` are mandatory.** "Every number has a citation" is on the design standard's
  ship checklist. A layer with an uncited figure does not ship.
- `brk` contains exactly one `<em>` span — the failure phrase. The design standard allows one magenta
  failure phrase per screen and this is it.
- **Edit `layersEn` and `layersEs` together.** They are parallel arrays; the same `id` must exist in
  both. Changing an `id` breaks URLs — don't.
- Keep `details` to three bullets. The layout is built for three.

---

## 4. Spanish

Spanish is not a plugin, it is a parallel array. Every content export has an `Es` twin:
`layersEn`/`layersEs`, `fieldLogEntry…`/`fieldLogEntry…Es`, `localeCopy.en`/`localeCopy.es`.

- Routes: `/es`, `/es/log`, `/es/log/[slug]`, `/es/notes`, `/es/notes/[slug]`.
- UI strings (buttons, labels, hints) are in `localeCopy` — not hardcoded in components.
- **Write real accents.** The file is UTF-8 and handles them. Much of the existing Spanish is
  accent-stripped (`electrica`, `busqueda`, `tecnologia`); that is a known debt, not the house style.
  Do not add to it.

---

## 5. Renaming a slug

The repo already has a good pattern for this — keep using it. When `the-mental-time-trap` became
`the-trap-of-time`, the old route stayed as a five-line redirect:

```tsx
import { redirect } from "next/navigation";

export default function LegacyMentalTimeTrapPage() {
  redirect("/notes/the-trap-of-time");
}
```

Three of these exist under `src/app/notes/`. Never delete a published URL — leave the stub.

---

## 6. Ship

```powershell
cd "$env:USERPROFILE\Documents\ChatGPT\gatekpt-ai"
git checkout gatekpt-ai-public-site     # production branch — main is NOT what deploys
npm run dev                             # localhost:3001
npm run verify                          # lint + typecheck + build. Must pass.
```

`npm run verify` is the gate. If it passes, the content is structurally sound.

**Branch discipline:** the Windows worktree sits on `main`; production deploys from
`gatekpt-ai-public-site`. Switch before editing anything you intend to publish, or you will write a
good note onto the wrong branch.

### Before you push

- [ ] `npm run verify` passes
- [ ] New entry appears at `/log` **and** `/es/log` — if it is missing from one, you skipped an `Es` twin
- [ ] The note page renders at its own URL
- [ ] Every new number has `src` and `srcUrl`
- [ ] No banned words from `docs/standards/GATEKPT_GUIDELINES.md`
- [ ] Spanish has real accents
- [ ] Old URL still redirects, if you renamed anything

---

## 7. Known debt — not your fault, don't be confused by it

1. **Three dead content modules** (section 0). Recommend moving `stack.ts` and `journal.ts` to
   `_to_delete\`, and deleting the `logEntriesEn`/`logEntriesEs` exports. Until then they are traps.
2. **Inconsistent wrapper naming.** Note 001's wrapper is `fieldLogEntryEn`; note 002's is
   `fieldLogEntryNote002`. Renaming 001's pair to `fieldLogEntryNote001`/`…Note001Es` would make the
   pattern obvious for note 003.
3. **`getEntries()` is hand-maintained.** Every note requires editing a function. A `NOTES` array
   sorted by `date` descending would remove the most common publishing mistake.
4. **`content.ts` is 30 KB and growing.** It holds types, seven layers ×2, log entries, locale copy,
   and every note body. Splitting into `layers.ts` / `notes.ts` / `copy.ts` is the natural next move
   once there are five or six notes.
5. **`globals.css` has two competing `:root` blocks.** See `docs/standards/XIV_RECONCILIATION.md`.
