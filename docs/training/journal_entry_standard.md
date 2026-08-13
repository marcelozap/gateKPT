# GateKPT Journal Entry Standard

Use this standard for every public GateKPT journal entry before it becomes a page on the site.

## Purpose

Each entry should turn a real observation, source, question, or mental model into a clear public artifact.

It should feel like Marcelo thinking in public, not like a generic AI article.

## Required Shape

```md
---
title: ""
slug: ""
note_number: "NOTE N 000"
date: "YYYY-MM-DD"
language: "en"
translation_of: ""
summary: ""
primary_layer: ""
source_status: "sourced | personal | verify before publishing"
canonical_url: ""
---

# Title

Short opening idea.

## The Point

The main claim in plain language.

## Why It Matters

Why a reader should care, especially for work, learning, identity, systems, or AI.

## The System Layer

Connect the idea to one or more AI layers:

- Input
- Tokens
- Context
- Models
- Tools
- Chips
- Power

## What To Watch

What could change, what is uncertain, or what the reader should test for themselves.

## Sources

- Source name: URL
```

## Voice Rules

- Start close to the reader. Then move outward into the system.
- Use plain language before technical language.
- Keep one strong idea at the center.
- Make the reader feel capable, not lectured.
- Avoid hype, generic productivity language, and corporate filler.
- Do not use `Field log` or `Stack map` as public labels.
- Prefer `Published writing`, `Writing`, `AI layers`, `note`, and `journal entry`.

## Source Rules

- If a factual claim depends on current numbers, laws, company policy, pricing, privacy, or technical behavior, mark it `verify before publishing` until checked against a primary source.
- Keep raw pasted articles, transcripts, screenshots, and research notes in `docs/training/source_references/`.
- Summarize source material. Do not paste full articles into the public entry.
- Source links should stay visible when the claim benefits from a receipt.

## Bilingual Rules

Every public journal entry should ship as a matched English and Spanish pair unless Marcelo explicitly says English-only.

Use the English entry as the source of truth, then create the Spanish version with the same:

- slug
- note number
- date
- core idea
- source links
- claim strength
- section order

The Spanish version should not be a stiff literal translation. It should preserve the meaning, tone, and clarity in natural Spanish.

Use these route patterns:

- English note: `/notes/{slug}`
- Spanish note: `/es/notes/{slug}`
- English writing index entry: `/log` or `/log/{slug}`
- Spanish writing index entry: `/es/log` or `/es/log/{slug}`

When adding code-backed notes in `src/gatekpt/content.ts`, update both the English and Spanish public paths or clearly mark the Spanish entry as pending.

## Entry Checklist

- The title is specific.
- The summary fits in one or two sentences.
- The opening has a human hook.
- The entry says one clear thing.
- The AI/system layer is explicit.
- Sources are separated from personal reflection.
- Any unstable claim is verified or marked before publishing.
- The final page has English and Spanish paths if the entry is meant to be bilingual.

## Bilingual Checklist

- English entry exists.
- Spanish entry exists.
- The Spanish entry uses the same slug and note number.
- Source links match in both languages.
- The writing index lists the entry in both languages.
- The homepage/latest-note link points to the intended current entry.
