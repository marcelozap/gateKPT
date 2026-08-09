"use client";

import { motion } from "framer-motion";
import {
  BadgeDollarSign,
  BrainCircuit,
  BriefcaseBusiness,
  Cpu,
  Database,
  FileText,
  GraduationCap,
  Layers3,
  LineChart,
  MessageSquareText,
  Newspaper,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";

const stackLayers = [
  {
    title: "Physical Compute",
    subtitle: "GPUs, CPUs, memory, storage, networking, data centers, power, cooling.",
    icon: Cpu,
    accent: "border-cyan-500 bg-cyan-50 text-cyan-700",
  },
  {
    title: "Data Foundations",
    subtitle: "Schemas, pipelines, traceability, data quality, governance, synthetic examples.",
    icon: Database,
    accent: "border-emerald-500 bg-emerald-50 text-emerald-700",
  },
  {
    title: "Models",
    subtitle: "Tokens, embeddings, transformers, training, inference, context windows.",
    icon: BrainCircuit,
    accent: "border-violet-500 bg-violet-50 text-violet-700",
  },
  {
    title: "AI Engineering",
    subtitle: "APIs, agents, RAG, evals, logging, guardrails, human review.",
    icon: Workflow,
    accent: "border-amber-500 bg-amber-50 text-amber-700",
  },
];

const learningTracks = [
  {
    title: "Start Here",
    detail: "A plain-English map of the full AI stack from electricity and chips to apps and business value.",
    icon: GraduationCap,
  },
  {
    title: "Prompting",
    detail: "Role, context, task, constraints, examples, output format, and verification.",
    icon: MessageSquareText,
  },
  {
    title: "Business of AI",
    detail: "NVIDIA, AMD, OpenAI, Anthropic, cloud providers, private rounds, IPO watch, and talent markets.",
    icon: LineChart,
  },
  {
    title: "Real-World AI",
    detail: "Healthcare, finance, procurement, call centers, workflow redesign, and operational ROI.",
    icon: BriefcaseBusiness,
  },
  {
    title: "AI Safety",
    detail: "Bias, privacy, model limits, source attribution, human-in-the-loop review, and audit trails.",
    icon: ShieldCheck,
  },
  {
    title: "Weekly Brief",
    detail: "Current AI news translated into foundations, career takeaways, and LinkedIn-ready notes.",
    icon: Newspaper,
  },
];

const promptSteps = [
  "Role",
  "Context",
  "Task",
  "Constraints",
  "Examples",
  "Output",
  "Verification",
];

const weeklyFlow = [
  "Collect the week in AI news",
  "Separate facts from hype",
  "Map each story to the AI stack",
  "Write one evergreen note",
  "Turn it into 2-3 public posts",
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
      {children}
    </p>
  );
}

export function GatekptLanding() {
  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#171717]">
      <section className="border-b border-black/10 bg-[#f7f3ea] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-bold text-black/70">
              <Sparkles className="h-4 w-4 text-emerald-700" />
              AI from the ground up
            </div>
            <h1 className="max-w-4xl text-5xl font-black leading-[0.95] sm:text-6xl lg:text-7xl">
              GateKPT is a public notebook for learning AI end to end.
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-black/68">
              Hardware, data, models, prompting, engineering, markets, and real-world deployment
              explained in one consistent place.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.45, ease: "easeOut" }}
            className="grid gap-3 rounded-lg border border-black/10 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4 border-b border-black/10 pb-4">
              <div>
                <p className="text-sm font-black">The core idea</p>
                <p className="mt-1 text-sm leading-6 text-black/60">
                  AI is not just an app or a model. It is a stack of physical infrastructure,
                  data systems, algorithms, people, cost, and judgment.
                </p>
              </div>
              <Layers3 className="h-6 w-6 shrink-0 text-emerald-700" />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {["Beginner friendly", "Engineer useful", "Market aware", "Source grounded"].map((item) => (
                <div key={item} className="rounded-md border border-black/10 bg-[#fbfaf6] px-3 py-2 text-sm font-bold text-black/72">
                  {item}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section id="stack" className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <SectionLabel>Foundation map</SectionLabel>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
              The AI stack, broken into components you can actually study.
            </h2>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stackLayers.map((layer) => (
              <article key={layer.title} className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
                <div className={`mb-5 inline-flex rounded-md border p-2 ${layer.accent}`}>
                  <layer.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-black">{layer.title}</h3>
                <p className="mt-3 text-sm leading-6 text-black/62">{layer.subtitle}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="tracks" className="border-y border-black/10 bg-[#ebe7dc] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div className="max-w-3xl">
              <SectionLabel>Learning tracks</SectionLabel>
              <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
                Built like a training document, not a disappearing feed.
              </h2>
            </div>
            <p className="max-w-md text-sm font-medium leading-6 text-black/60">
              LinkedIn posts can come from this, but the knowledge stays here as the durable base.
            </p>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {learningTracks.map((track) => (
              <article key={track.title} className="rounded-lg border border-black/10 bg-[#fbfaf6] p-5">
                <track.icon className="h-6 w-6 text-black/76" />
                <h3 className="mt-4 text-lg font-black">{track.title}</h3>
                <p className="mt-3 text-sm leading-6 text-black/62">{track.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="prompting" className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <SectionLabel>Prompting fundamentals</SectionLabel>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
              A prompt is not a magic sentence. It is a work order for a model.
            </h2>
            <p className="mt-5 text-base font-medium leading-7 text-black/64">
              Good prompting means giving the model enough context, boundaries, examples, and success criteria
              to produce something useful and checkable.
            </p>
          </div>

          <div className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {promptSteps.map((step) => (
                <span key={step} className="rounded-md border border-black/10 bg-[#f7f3ea] px-3 py-2 text-sm font-black">
                  {step}
                </span>
              ))}
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-red-700">Weak</p>
                <p className="mt-3 text-sm font-semibold text-black/72">Explain GPUs.</p>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Stronger</p>
                <p className="mt-3 text-sm font-semibold leading-6 text-black/72">
                  Explain what a GPU does in AI to a beginner software engineer. Compare it to a CPU,
                  explain why memory bandwidth matters, and give one LLM training example.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="brief" className="border-t border-black/10 bg-[#171717] px-4 py-12 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Weekly system</p>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
              One weekly research note becomes the website update and the public posts.
            </h2>
            <p className="mt-5 text-base font-medium leading-7 text-white/64">
              The goal is to stay current without chasing noise: simplify the news, connect it to foundations,
              then publish the useful pieces.
            </p>
          </div>
          <div className="grid gap-3">
            {weeklyFlow.map((item, index) => (
              <div key={item} className="flex items-center gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-cyan-300 text-sm font-black text-black">
                  {index + 1}
                </span>
                <p className="text-sm font-bold text-white/82">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-black/10 p-5">
            <FileText className="h-6 w-6 text-emerald-700" />
            <h3 className="mt-4 text-lg font-black">Evergreen notes</h3>
            <p className="mt-2 text-sm leading-6 text-black/62">
              Pages that stay useful after the news cycle moves on.
            </p>
          </div>
          <div className="rounded-lg border border-black/10 p-5">
            <BadgeDollarSign className="h-6 w-6 text-amber-700" />
            <h3 className="mt-4 text-lg font-black">Market context</h3>
            <p className="mt-2 text-sm leading-6 text-black/62">
              Public companies, private valuations, compute costs, and hiring trends.
            </p>
          </div>
          <div className="rounded-lg border border-black/10 p-5">
            <Sparkles className="h-6 w-6 text-violet-700" />
            <h3 className="mt-4 text-lg font-black">Learn in public</h3>
            <p className="mt-2 text-sm leading-6 text-black/62">
              Clear explanations from a working engineer studying the whole stack.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
