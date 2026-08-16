# GateKPT Pro Platform Plan

GateKPT should become a professional AI research and learning platform: sharp enough that an AI engineer, data scientist, trader, recruiter, or technical hiring manager can tell the work is serious within the first screen.

The standard is not "nice portfolio page." The standard is:

> A public AI intelligence workspace for learning, industry awareness, career growth, and real-world engineering practice.

## North Star

GateKPT helps people understand the AI era end to end:

- what physically runs AI
- how data becomes useful
- how LLMs work
- how to prompt and evaluate model output
- how companies turn AI into products
- how markets price AI infrastructure and adoption
- how engineers build trustworthy systems
- how beginners can learn without drowning in jargon

It should feel like a professional research terminal crossed with a training notebook.

## Audience

Primary audiences:

- Marcelo, as a living research and career operating system
- engineers learning AI systems
- recruiters and hiring managers evaluating technical taste
- investors/traders tracking the AI buildout
- beginners who want clean explanations

Secondary audiences:

- operators in healthcare, finance, procurement, and support workflows
- students and career switchers
- technical founders looking for clear AI systems thinking

## Public Positioning

Short positioning:

> GateKPT is an AI intelligence notebook for understanding the stack: compute, data, models, prompting, deployment, markets, and risk.

More professional version:

> GateKPT maps the AI stack from physical infrastructure to real-world deployment, combining technical explainers, market context, prompting frameworks, and system design notes.

Avoid:

- secret identity references
- employer-specific confidential examples
- hype claims without sources
- pretending to be an official research institution
- gossip about individual compensation or job movement

## Product Pillars

### 1. AI Stack Map

Purpose:

Give visitors a mental model before details.

Core layers:

1. Compute: GPUs, CPUs, HBM, networking, data centers, power, cooling
2. Data: collection, cleaning, schemas, lineage, governance, traceability
3. Models: tokens, embeddings, transformers, training, inference, context windows
4. Applications: APIs, agents, RAG, workflows, dashboards, automation
5. Evaluation: accuracy, hallucination, confidence, regression tests, human review
6. Markets: public companies, private rounds, pricing, margins, talent, capex
7. Risk: privacy, bias, security, regulatory exposure, misuse, model limits

Future design:

- make this an interactive map
- clicking a layer opens a concise lesson
- each layer has beginner, engineer, and market tabs

### 2. Prompt Lab

Purpose:

Teach prompting as professional communication and workflow design.

Core framework:

1. Role
2. Context
3. Task
4. Constraints
5. Inputs
6. Examples
7. Output format
8. Verification

Future features:

- prompt before/after examples
- prompt debugging checklist
- reusable prompt templates
- "bad prompt to good prompt" interactive tool
- model-output evaluation examples

### 3. Weekly AI Signal Brief

Purpose:

Turn news into structured understanding.

Weekly workflow:

1. What happened?
2. Why does it matter?
3. Which AI stack layer does it affect?
4. Who benefits?
5. What is uncertain?
6. What should engineers learn?
7. What should investors/traders watch?
8. What should be posted publicly?

Output formats:

- website brief
- LinkedIn post 1: beginner explanation
- LinkedIn post 2: engineer/business insight
- optional LinkedIn post 3: market/talent angle

### 4. Market Intelligence

Purpose:

Support industry awareness without giving financial advice.

Coverage:

- NVIDIA
- AMD
- Microsoft
- Google
- Amazon
- Meta
- Oracle
- Broadcom
- TSMC
- memory suppliers
- data center power/cooling companies
- private AI companies like OpenAI, Anthropic, xAI, Mistral, Perplexity

Concepts to explain:

- capex
- inference cost
- gross margin
- token pricing
- GPU supply
- data center constraints
- talent scarcity
- private valuation vs public comps
- IPO watchlist

Rule:

All market claims need dates and sources. Rumors must be labeled as rumors.

### 5. Career Intelligence

Purpose:

Make GateKPT useful for future jobs.

Topics:

- AI engineer skill map
- forward deployed engineer skill map
- data engineer to AI engineer bridge
- healthcare AI vocabulary
- finance AI vocabulary
- procurement AI vocabulary
- interview answers
- demo project case studies
- resume bullet translation

Future pages:

- `/career/ai-engineer-roadmap`
- `/career/fde-playbook`
- `/career/interview-stories`
- `/career/project-demos`

### 6. Real-World Systems

Purpose:

Show serious engineering judgment.

Topics:

- data lake vs EHR
- RAG vs fine-tuning
- human-in-the-loop AI
- audit trails
- model evaluation
- structured outputs
- safety gates
- role-based access
- production monitoring
- data quality checks

This pillar should make a senior engineer think:

> This person understands that AI work is mostly systems, data, trust, and workflow.

## Design Direction

Use `../standards/GATEKPT_DESIGN_STANDARD.md` as the source of truth for visual rules, interaction modes, color, typography, motion, and public-safe language.

Professional, dark, high-contrast, precise.

Not:

- generic SaaS landing page
- overstuffed cyberpunk dashboard
- fluffy AI blog
- portfolio gimmick

Feel:

- research terminal
- field manual
- intelligence briefing
- training lab
- executive dashboard

Visual rules:

- one main idea per viewport
- 3-5 choices max per screen
- clear reading path left to right, top to bottom
- large headlines only for page-level ideas
- smaller, dense panels for technical content
- use color to encode meaning, not decoration

Color system:

- black/near-black: base
- off-white: long-form notes
- emerald: learning/progress/trust
- cyan: compute/model signal
- amber: market/cost/value
- violet: model/reasoning
- red only for risk/warnings

Interaction rules:

- every interaction should teach or reveal structure
- avoid animation that does not clarify meaning
- progressive disclosure beats huge grids
- interactive examples should have "input -> process -> output -> check"

## Cognitive Design Principles

Use this as the layout standard.

### 1. Chunking

People can only hold a few items in working memory at once. Default to 3 primary choices, 4 stack layers, or 5 workflow steps.

### 2. Progressive Disclosure

Do not show every detail immediately. Let users move from summary to example to deeper technical detail.

### 3. Recognition Over Recall

Use labels, diagrams, and repeated frameworks so people recognize patterns instead of remembering definitions.

### 4. Dual Coding

Pair text with visual structure: icons, maps, flows, diagrams, and before/after examples.

### 5. Active Recall

After a lesson, include a short prompt:

- explain this back
- identify the layer
- fix the prompt
- choose the risk
- compare two architectures

### 6. Spaced Repetition

Important concepts should recur across pages:

- traceability
- source of truth
- inference vs training
- RAG vs fine-tuning
- context vs memory
- evaluation
- human review
- cost

## Recommended Site Architecture

Future routes:

```text
/
/stack
/stack/compute
/stack/data
/stack/models
/stack/deployment
/prompt-lab
/weekly-brief
/markets
/career
/systems
/notes
/demos
```

MVP next pages:

1. `/stack`
2. `/prompt-lab`
3. `/weekly-brief`
4. `/markets`
5. `/career`

## Homepage Rework Ideas

Current homepage is a good direction but still an MVP.

Next iteration:

### Hero

Goal:

Immediately communicate professionalism and usefulness.

Possible headline:

> AI intelligence, organized for builders and operators.

Alternative:

> Understand the AI stack before the market moves.

Alternative:

> A field manual for the AI era.

Hero components:

- one sentence positioning
- three role-based entry buttons: Learn, Build, Track
- one featured "current signal" panel
- no more than three visible panels

### Stack Preview

Use a horizontal or vertical system diagram:

Compute -> Data -> Models -> Deployment -> Evaluation -> Markets/Risk

Each node:

- short label
- one sentence
- click target

### Featured Research

A current weekly signal card:

- topic
- why it matters
- stack layer
- engineer takeaway
- market takeaway

### Prompt Lab Preview

Show one bad prompt transformed into a professional prompt.

### Career/Systems Preview

Show that this is practical:

- AI Engineer Roadmap
- Forward Deployed AI notes
- Healthcare workflow example
- Data quality before LLMs

## Content Standards

Every page should answer:

1. What is it?
2. Why does it matter?
3. Where does it sit in the AI stack?
4. What problem does it solve?
5. What does a beginner need to know?
6. What does an engineer need to know?
7. What does a trader/investor need to watch?
8. What are common misunderstandings?
9. What is one concrete example?
10. What should I learn next?

Every current-events post should include:

- date
- source links
- confidence level
- what is known
- what is unknown
- why it matters
- stack layer affected

## PhD/Senior Engineer Impressiveness Standard

A serious AI person will not be impressed by buzzwords. They will be impressed by:

- correct distinctions
- careful uncertainty
- system diagrams
- evaluation thinking
- data lineage
- clean architecture
- realistic deployment constraints
- security/privacy awareness
- cost awareness
- clear writing

Things that signal seriousness:

- "source of truth"
- "traceability"
- "lineage"
- "evaluation harness"
- "regression test"
- "human-in-the-loop"
- "minimum necessary data"
- "bounded context"
- "retrieval quality"
- "structured outputs"
- "observability"
- "latency and cost"

Things to avoid:

- "AI will change everything" with no mechanism
- "agents" with no control loop
- "RAG" without retrieval/evaluation discussion
- "fine-tune it" as a default answer
- unsourced salary or IPO claims
- overdesigned visuals that hide weak content

## Build Roadmap

### Phase 1: Professional Homepage

Status: in progress.

Tasks:

- simplify first screen
- improve typography hierarchy
- make entry paths clearer
- add featured signal panel
- reduce equal-weight boxes
- make color coding consistent
- verify mobile layout

### Phase 2: Stack Page

Build `/stack` as the core mental model page.

Sections:

- full AI stack diagram
- each layer explained
- beginner/engineer/market perspective
- common misunderstandings
- examples

### Phase 3: Prompt Lab

Build `/prompt-lab`.

Features:

- prompt anatomy
- examples
- before/after
- prompt evaluation checklist
- templates

### Phase 4: Weekly Brief System

Build `/weekly-brief`.

Features:

- current brief template
- source list
- stack layer mapping
- LinkedIn drafts
- archive of prior briefs

### Phase 5: Markets Page

Build `/markets`.

Features:

- AI market map
- public companies
- private companies
- compute supply chain
- talent market
- IPO watch
- source-grounded updates

### Phase 6: Career Page

Build `/career`.

Features:

- AI engineer skill map
- FDE skill map
- demo project library
- interview story bank
- resume translation notes

## Immediate Next Iteration Checklist

- [ ] Rework homepage hero copy toward pro audience
- [ ] Replace "Beginner / Engineer / Market" cards with "Learn / Build / Track"
- [ ] Add a featured intelligence brief card above the fold
- [ ] Add visual stack diagram with fewer card borders
- [ ] Create first `/stack` route
- [ ] Create first `/prompt-lab` route
- [ ] Add content model so future notes are data-driven
- [ ] Check mobile viewport
- [ ] Check desktop viewport
- [ ] Run `npm run verify`
- [ ] Deploy only after visual pass

## Working Notes

The current live version is a good MVP but not the final identity. It has the right concept but needs a more professional information architecture. The next goal is not more decoration. The next goal is sharper hierarchy, better content density, and a clearer professional purpose.

The site should prove three things quickly:

1. Marcelo understands AI as a full system.
2. Marcelo can explain hard things clearly.
3. Marcelo has taste and can build polished tools people want to use.
