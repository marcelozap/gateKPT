# XIV Visual Standard ↔ GateKPT Design Standard — Reconciliation

Date: 2026-08-13
Inputs: `XIV\_XIV_KIT\06_XIV_VISUAL_STANDARD.md` · `docs/standards/GATEKPT_DESIGN_STANDARD.md` (v1.0) · `src/app/globals.css`

Rule applied: **XIV palette tokens win.** Nothing was overwritten. The XIV tokens were added to
`globals.css` as a namespaced `--xiv-*` block at the top; every conflict below is still live and
needs your call before the shipped tokens are repointed.

---

## 0. The thing to know first

`globals.css` contains **two competing `:root` blocks**, and neither matches the design standard.

| | line ~5 | line ~1500 | winner at runtime |
|---|---|---|---|
| `--void` | `#080806` | `#02050A` | `#02050A` |
| `--panel` | `rgba(12,14,13,.84)` | `#07101A` | `#07101A` |
| `--visor` | `#8ff0ff` | `#68F7FF` | `#68F7FF` |

The first block also defines a **warm** ramp that the second never overrides, so it is still shipping:
`--ink: #f4efe4` · `--void-2: #11100c` · `--amber: #f5b84b` · `--green: #a7f3b4` · `--rust: #c86b43`.

That warm ramp contradicts both standards. `GATEKPT_DESIGN_STANDARD.md` says *"no warm beige homepage
bands"* and specifies a cold near-monochrome foreground; XIV specifies cyan/magenta on near-black.
`--ink: #f4efe4` is a warm cream and it is your body-text color.

**This is the highest-value fix in the file** — bigger than any single hex below. Two `:root` blocks
means every future token edit is a coin flip about which one wins.

---

## 1. Palette conflicts, token by token

| Role | XIV (law) | GateKPT doc | globals.css (effective) | Verdict |
|---|---|---|---|---|
| void | `#05070D` | `#05070D` | `#02050A` | doc agrees with XIV; **CSS drifted darker** → repoint to `#05070D` |
| deep / panel | `#0B1220` | `#080C15` / `#0B111C` | `#07101A` | three values, all close. XIV wins → `#0B1220` |
| **cyan / visor** | **`#22D3EE`** | **`#7DF9FF`** | `#68F7FF` | ⚠️ **REAL CONFLICT — see §2** |
| cyan-hot / visor-core | `#67E8F9` | `#E4FDFF` | `#E4FDFF` | doc + CSS agree against XIV. Downstream of §2 |
| magenta | `#FF2D95` | `#FF2D95` | `#FF2D95` | ✅ **only token all three agree on** |
| violet | `#7C3AED` | `#8B5CF6` | `#6847F5` | three different violets. XIV wins → `#7C3AED` |
| amber | `#FFB020` | `#FFB020` | `#D99A32` + `#f5b84b` | doc agrees with XIV; **CSS drifted twice** → `#FFB020` |
| mist / near | `#94A3B8` | `#93A0B4` | `#93A0B4` | cosmetically identical. Adopt XIV, no visual change |
| white / focal | `#E6F4FF` | `#F4F8FC` | `#F4F8FC` + warm `#f4efe4` | XIV is cyan-shifted, doc is neutral. XIV wins → `#E6F4FF` |

**In the doc but not in XIV** (keep — XIV has no opinion): `--visor-deep` `--neon-jade` `--ok` `--miss`
`--ghost` `--chrome` `--visor-35`.
**In XIV but not in the doc** (added): `--xiv-glow`.

---

## 2. The one that needs your decision: visor cyan

XIV says `#22D3EE`. GateKPT says `#7DF9FF`. These are not a rounding error — `#22D3EE` is a
saturated teal, `#7DF9FF` is a pale ice cyan. Side by side they read as different brands.

Arguments are on both sides and I am not going to silently pick:

- **For `#22D3EE` (XIV):** it is the stated law, the brief says XIV palette tokens win, and it is
  what every other lane will inherit. One cyan across six properties is the whole point of a token.
- **For `#7DF9FF` (GateKPT):** your session primer names `#7DF9FF` explicitly as the design law and
  ties it to the reference frame — *"this is what lets it look cyberpunk and still pass a
  recruiter."* It is also already shipped on a live, deployed, bilingual site.

Contrast on `--xiv-void #05070D`: `#22D3EE` ≈ 9:1, `#7DF9FF` ≈ 13:1. Both pass comfortably; this is
not an accessibility decision, it is an identity decision.

**My recommendation:** keep `#7DF9FF` as gatekpt's *product* accent and register it in the XIV
standard as the sanctioned per-lane variance — 06 already has a "per-lane translation" table and
already grants rally and $Zoe deviations. Amend 06 rather than repaint a shipped site. But this is
your call and the brief says XIV wins, so I have left both defined and changed nothing.

---

## 3. Rule conflicts (not colors)

| # | XIV | GateKPT | Resolution |
|---|---|---|---|
| 1 | Emissive glow: `box-shadow: 0 0 24px -4px` at 40–60% | **"Avoid drop shadows"** · ship checklist: "No drop shadows" | **Not actually contradictory.** GateKPT bans *elevation* shadows; XIV mandates *emissive* glow. Write it down as two rules or someone will "fix" the glow away. Suggested wording: *no shadow may imply height; glow may imply light.* |
| 2 | Accent ratio **8%** cyan (70/20/8/2) | Accent **under 5%** of pixels | Numeric conflict. GateKPT is stricter. Recommend keeping 5% for gatekpt — it is the public marketing surface and the tighter budget is why the current site reads clean. |
| 3 | Motion **200–400ms** ease-out | Out **130ms**, in **240ms** | 130ms violates XIV's floor. In-transition (240ms) already complies. Recommend raising out to 200ms, or granting the exception in 06. |
| 4 | "Dark is the only mode. Don't build the toggle." | "Dark mode is the primary product." | GateKPT's wording leaves a light mode open. Tighten to match XIV. |
| 5 | Radius: unspecified | 2px | No conflict. GateKPT is more specific; keep it. |
| 6 | `--xiv-violet` on void ≈ 3.1:1 → **decorative only, never text** | Violet in blurred atmosphere only | ✅ Already compatible. |

---

## 4. What was changed on disk

- `src/app/globals.css` — **added** a namespaced `--xiv-*` `:root` block after the `@tailwind`
  directives. Additive only; no existing declaration was edited or removed. The two blocks below it
  still drive the shipped UI.

Nothing else. No hex in the shipped blocks was repointed, because doing so would have silently
resolved §2 in one direction.

---

## 5. Recommended order once you decide

1. Settle §2 (cyan). Everything else is mechanical after that.
2. Collapse the two `:root` blocks into one, and delete the warm ramp (`--ink` `--rust` `--void-2`).
3. Repoint the agreed tokens to `var(--xiv-*)` so there is one source, not forty.
4. Amend `06_XIV_VISUAL_STANDARD.md` with whatever per-lane variance you granted, so the next
   session does not reopen this.
