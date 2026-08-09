/* -------------------------------------------------------------------
   The seven layers - single source of truth for the taxonomy.
   Every article, tag, route and brief item resolves to one of these.
   Lock these IDs: renaming a layer later breaks every URL.

   WRITING RULES for this file. Enforce them on every edit.
     - Plain words. If a normal person would not use it, do not use it.
     - Short sentences. Under 12 words where possible.
     - No drama. State the fact and stop.
     - One idea per line. The reader sees one beat at a time.

   LAYERS vs LENSES.
   A LAYER is a place in the stack where something can break. Seven,
   fixed. L01 Power and L02 Chips are not the same thing: chips are
   bought and arrive in weeks, power is queued for and takes years.
   A LENS cuts across every layer and lives in tags, never as an
   eighth layer.
   ------------------------------------------------------------------- */

/** Cross-cutting lenses. Applied on top of a layer, never instead of one. */
export const LENSES = [
  "climate",
  "energy",
  "ethics",
  "money",
  "rules",
  "safety",
  "jobs",
] as const;

export type Lens = (typeof LENSES)[number];

export type Layer = {
  id: string;
  name: string;
  essence: string;
  fig: string;
  unit: string;
  figcap: string;
  src: string;
  srcUrl: string;
  brk: string; // contains <em> around the failure phrase
};

export const LAYERS: Layer[] = [
  {
    id: "L01",
    name: "Power",
    essence: "AI runs on electricity. Getting it takes years.",
    fig: "5+",
    unit: "yr",
    figcap: "Median wait to connect a new project to the US grid.",
    src: "Berkeley Lab, Queued Up 2026",
    srcUrl: "https://emp.lbl.gov/publications/queued-2026-edition-characteristics",
    brk: "A data center takes about 18 months to build. <em>The power connection takes longer.</em>",
  },
  {
    id: "L02",
    name: "Chips",
    essence: "Chips are fast. Getting data to them is slow.",
    fig: "3",
    unit: "TB/s",
    figcap: "Memory bandwidth on one NVIDIA H100 chip.",
    src: "NVIDIA, H100 overview",
    srcUrl: "https://www.nvidia.com/en-us/data-center/h100/",
    brk: "The chip finishes its math early <em>and waits on memory.</em>",
  },
  {
    id: "L03",
    name: "Data",
    essence: "A model can only learn what its data contains.",
    fig: "60",
    unit: "%",
    figcap: "AI projects Gartner expects to be dropped by 2026 without good data.",
    src: "Gartner, AI-ready data risk",
    srcUrl: "https://www.gartner.com/en/newsroom/press-releases/2025-02-26-lack-of-ai-ready-data-puts-ai-projects-at-risk",
    brk: "Collecting data is cheap. <em>Deciding what is correct is not.</em>",
  },
  {
    id: "L04",
    name: "Models",
    essence: "Building the model is one cost. Running it is the recurring one.",
    fig: "40",
    unit: "GB",
    figcap: "Memory used by one long request to Llama 3 70B.",
    src: "NVIDIA, KV cache offload",
    srcUrl: "https://developer.nvidia.com/blog/accelerate-large-scale-llm-inference-and-kv-cache-offload-with-cpu-gpu-memory-sharing/",
    brk: "Everyone quotes the build cost. <em>The bill comes from running it.</em>",
  },
  {
    id: "L05",
    name: "Software",
    essence: "The model is one part. The software around it decides if it works.",
    fig: "1st",
    unit: "",
    figcap: "Search is the first thing to check when an answer comes back wrong.",
    src: "RAG systems review, 2025",
    srcUrl: "https://arxiv.org/html/2507.18910v1",
    brk: "If the right page was never found, <em>no prompt can fix it.</em>",
  },
  {
    id: "L06",
    name: "Testing",
    essence: "If you cannot test it, you cannot trust it.",
    fig: "4",
    unit: "steps",
    figcap: "NIST's four steps for AI risk: govern, map, measure, manage.",
    src: "NIST AI Risk Framework",
    srcUrl: "https://airc.nist.gov/airmf-resources/airmf/5-sec-core/",
    brk: "It worked last week, the model updated, <em>and nobody can prove either part.</em>",
  },
  {
    id: "L07",
    name: "Business",
    essence: "A tool nobody uses has no value.",
    fig: "16",
    unit: "%",
    figcap: "AI projects IBM says have scaled across a whole company.",
    src: "IBM, AI data quality",
    srcUrl: "https://www.ibm.com/think/topics/ai-data-quality",
    brk: "The tech worked. <em>Then it changed hands and the goal changed.</em>",
  },
];
