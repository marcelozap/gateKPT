/* -------------------------------------------------------------------
   The seven layers - single source of truth for the taxonomy.
   Every article, tag, route and brief item resolves to one of these.
   Lock these IDs: renaming a layer later breaks every URL.

   The `src` fields are intentionally short because they render inside
   the instrument. Keep sources public, specific, and easy to verify.
   ------------------------------------------------------------------- */

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
  q: string;
  a: [string, string];
  right: 0 | 1;
  why: string;
};

export const LAYERS: Layer[] = [
  {
    id: "L01",
    name: "Power & Site",
    essence: "Every model runs on a grid connection someone waited years for.",
    fig: "5+",
    unit: "yr",
    figcap: "Median time from interconnection request to commercial operation for U.S. projects built in 2025.",
    src: "Berkeley Lab, Queued Up 2026",
    srcUrl: "https://emp.lbl.gov/publications/queued-2026-edition-characteristics",
    brk: "A data center takes about 18 months to build. <em>The interconnect takes longer than the building.</em>",
    q: "Which is usually the longer lead time?",
    a: ["Constructing the facility", "Connecting it to the grid"],
    right: 1,
    why: "Construction is a solved logistics problem. Grid interconnection is a queue you enter, not a task you execute - which makes power the binding constraint on everything above it.",
  },
  {
    id: "L02",
    name: "Compute",
    essence: "The accelerator is fast. Feeding it is the hard part.",
    fig: "3",
    unit: "TB/s",
    figcap: "Memory bandwidth per NVIDIA H100 GPU in accelerated servers.",
    src: "NVIDIA, H100 overview",
    srcUrl: "https://www.nvidia.com/en-us/data-center/h100/",
    brk: "At small batch sizes you pay for silicon that sits idle, <em>waiting on memory it already ordered.</em>",
    q: "What usually caps inference throughput?",
    a: ["Arithmetic - available FLOPs", "Memory bandwidth"],
    right: 1,
    why: "Serving is memory-bound far more often than compute-bound. Weights and KV cache cross the memory bus for every token - the multiply units finish early and wait.",
  },
  {
    id: "L03",
    name: "Data",
    essence: "A model inherits the shape of its corpus, including the holes.",
    fig: "60",
    unit: "%",
    figcap: "AI projects Gartner expects organizations to abandon through 2026 when unsupported by AI-ready data.",
    src: "Gartner, AI-ready data risk",
    srcUrl: "https://www.gartner.com/en/newsroom/press-releases/2025-02-26-lack-of-ai-ready-data-puts-ai-projects-at-risk",
    brk: "Collection is cheap and getting cheaper. <em>Judgment is the line item that does not fall.</em>",
    q: "Where does data cost actually concentrate?",
    a: ["Acquiring and storing it", "Labeling and curating it"],
    right: 1,
    why: "Storage and scraping trend toward zero. Expert judgment - deciding what is correct, in context, at the edges - is human time, and human time does not follow a cost curve.",
  },
  {
    id: "L04",
    name: "Model",
    essence: "Training sets the ceiling. Serving sets the bill.",
    fig: "40",
    unit: "GB",
    figcap: "Approximate KV cache memory for a single 128k-token Llama 3 70B request.",
    src: "NVIDIA Developer Blog, KV cache offload",
    srcUrl: "https://developer.nvidia.com/blog/accelerate-large-scale-llm-inference-and-kv-cache-offload-with-cpu-gpu-memory-sharing/",
    brk: "The cost curve everyone quotes is a training curve. <em>Serving moves on different physics.</em>",
    q: "At long context, what dominates serving memory?",
    a: ["The model weights", "The KV cache"],
    right: 1,
    why: "Weights are a fixed cost paid once per replica. The KV cache grows with every token in every concurrent request - which is why context length, not parameter count, tends to set your capacity ceiling.",
  },
  {
    id: "L05",
    name: "Application",
    essence: "The model is capable. The system around it decides whether that shows.",
    fig: "1st",
    unit: "",
    figcap: "Retrieval is the first place to look when a grounded answer comes back wrong.",
    src: "RAG systems review, 2025",
    srcUrl: "https://arxiv.org/html/2507.18910v1",
    brk: "If the right passage was never retrieved, <em>no prompt can recover it.</em>",
    q: "A retrieval system answers wrong. Look where first?",
    a: ["The prompt and generation step", "What the retriever returned"],
    right: 1,
    why: 'Most failures labeled "hallucination" are recall failures wearing a costume. Instrument what came back before you touch the prompt - otherwise you are tuning the part that was working.',
  },
  {
    id: "L06",
    name: "Evaluation",
    essence: "Without an eval set you do not have a system. You have a demo.",
    fig: "4",
    unit: "fn",
    figcap: "NIST AI RMF core functions for trustworthy AI risk work: govern, map, measure, manage.",
    src: "NIST AI RMF Core",
    srcUrl: "https://airc.nist.gov/airmf-resources/airmf/5-sec-core/",
    brk: "It worked yesterday, the weights changed, <em>and now nobody can prove either statement.</em>",
    q: "When should the eval set be written?",
    a: ["Once the feature works", "Before the feature is built"],
    right: 1,
    why: "Writing evals first forces you to define success in advance, while you are still honest. Written afterward, they are shaped - unconsciously - to pass the thing you already built.",
  },
  {
    id: "L07",
    name: "Deployment",
    essence: "A system nobody adopts has zero accuracy in practice.",
    fig: "16",
    unit: "%",
    figcap: "AI initiatives IBM says have successfully scaled across the enterprise, citing its 2025 CEO Study.",
    src: "IBM, AI data quality",
    srcUrl: "https://www.ibm.com/think/topics/ai-data-quality",
    brk: "The technology cleared its bar. <em>The bar changed when the project crossed the org chart.</em>",
    q: "Where do enterprise pilots most often stall?",
    a: ["Model quality falls short", "The organizational handoff"],
    right: 1,
    why: "Pilots are scoped by one team and judged by another, and the success criteria quietly change at the boundary. It is a deployment-layer problem that looks, from the inside, like a model problem.",
  },
];
