export type JournalEntry = {
  slug: string;
  date: string;
  title: string;
  layer: string;
  summary: string;
  body: string[];
};

export const JOURNAL_ENTRIES: JournalEntry[] = [
  {
    slug: "ai-stack-ground-map",
    date: "2026-08-09",
    title: "AI stack ground map",
    layer: "L01-L07",
    summary:
      "A first public version of the system map: power, chips, data, models, software, evaluation, and business context.",
    body: [
      "The first thing I wanted to make public was the map itself. AI is usually explained from the model outward, but that skips the system underneath it.",
      "Power, chips, data, models, software, evaluation, and business context all shape what AI can actually do. If one layer is weak, everything above it bends around that limit.",
      "This log is where I will keep turning scattered notes into structured entries. Some entries will be technical, some will be market or career context, and some will be about how to use AI better in real work.",
    ],
  },
  {
    slug: "why-power-comes-first",
    date: "2026-08-09",
    title: "Why power comes first",
    layer: "L01 Power",
    summary:
      "AI is not only software. Compute depends on electricity, cooling, sites, interconnect, and physical buildout timelines.",
    body: [
      "The physical layer matters because models do not run in the abstract. They run in buildings full of chips, cooling systems, networking, and power contracts.",
      "A company can order hardware faster than it can always connect a new site to the grid. That makes power a real constraint, not a background detail.",
      "When AI news talks about model capability, I want to keep asking what physical layer had to exist before that capability could show up.",
    ],
  },
  {
    slug: "data-before-model-behavior",
    date: "2026-08-09",
    title: "Data before model behavior",
    layer: "L03 Data",
    summary:
      "A model can only reason over what has been structured, linked, governed, retrieved, and trusted enough to use.",
    body: [
      "A lot of AI discussions jump straight to the model, but practical systems usually fail earlier. The data is messy, split across tools, missing identifiers, or not trusted enough to automate against.",
      "Before an AI system can answer a question, someone has to decide what the records mean, how they connect, where they came from, and what confidence is acceptable.",
      "That is why formatting, schema design, traceability, and validation are not boring prep work. They are the foundation that makes the model useful.",
    ],
  },
  {
    slug: "prompting-as-work-design",
    date: "Planned",
    title: "Prompting as work design",
    layer: "Prompt lab",
    summary:
      "A practical guide for turning loose requests into context, constraints, examples, output formats, and verification steps.",
    body: [
      "Prompting is not magic phrasing. It is work design: context, objective, constraints, examples, output shape, and a way to check the result.",
      "I want this entry to become a reusable guide for people who are learning how to ask better questions of language models without turning it into hype.",
    ],
  },
  {
    slug: "weekly-ai-brief-format",
    date: "Planned",
    title: "Weekly AI brief format",
    layer: "Briefs",
    summary:
      "A recurring note format for tracking what changed, why it matters, and which layer of the stack it touches.",
    body: [
      "A weekly AI brief should not just collect headlines. It should map each event to the layer it changes: power, chips, data, models, software, evaluation, business context, or human workflow.",
      "The goal is to make the news usable: what changed, why it matters, what is uncertain, and what I should keep watching.",
    ],
  },
];

export function getJournalEntry(slug: string) {
  return JOURNAL_ENTRIES.find((entry) => entry.slug === slug);
}
