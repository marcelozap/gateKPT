"use client";

import { motion } from "framer-motion";
import {
  Activity,
  BadgeDollarSign,
  BrainCircuit,
  BriefcaseBusiness,
  Cpu,
  Database,
  FileText,
  Gauge,
  GraduationCap,
  Layers3,
  LineChart,
  Map,
  MessageSquareText,
  Newspaper,
  Orbit,
  ShieldCheck,
  Sparkles,
  Workflow,
  Zap,
} from "lucide-react";

const stackLayers = [
  {
    title: "Compute",
    signal: "Physical layer",
    subtitle: "GPUs, CPUs, memory, networking, data centers, power, cooling.",
    icon: Cpu,
    tint: "from-cyan-400/20 to-cyan-400/5 text-cyan-200 border-cyan-300/20",
  },
  {
    title: "Data",
    signal: "Trust layer",
    subtitle: "Schemas, pipelines, traceability, data quality, governance.",
    icon: Database,
    tint: "from-emerald-400/20 to-emerald-400/5 text-emerald-200 border-emerald-300/20",
  },
  {
    title: "Models",
    signal: "Reasoning layer",
    subtitle: "Tokens, embeddings, transformers, training, inference, context.",
    icon: BrainCircuit,
    tint: "from-violet-400/20 to-violet-400/5 text-violet-200 border-violet-300/20",
  },
  {
    title: "Deployment",
    signal: "Workflow layer",
    subtitle: "APIs, agents, RAG, evals, logging, guardrails, human review.",
    icon: Workflow,
    tint: "from-amber-400/20 to-amber-400/5 text-amber-200 border-amber-300/20",
  },
];

const learningTracks = [
  {
    title: "Foundation Reps",
    detail: "Computer basics, AI hardware, tokens, embeddings, inference, and model limits.",
    icon: GraduationCap,
  },
  {
    title: "Prompt Lab",
    detail: "Role, context, task, constraints, examples, output format, and verification.",
    icon: MessageSquareText,
  },
  {
    title: "Market Signal",
    detail: "NVIDIA, AMD, cloud providers, private AI rounds, public-company exposure, and talent markets.",
    icon: LineChart,
  },
  {
    title: "Deployment Notes",
    detail: "Healthcare, finance, procurement, contact centers, dashboards, and operational ROI.",
    icon: BriefcaseBusiness,
  },
  {
    title: "Risk Controls",
    detail: "Bias, privacy, model uncertainty, audit trails, source attribution, and human review.",
    icon: ShieldCheck,
  },
  {
    title: "Weekly Brief",
    detail: "News converted into foundations, career takeaways, and post-ready explanations.",
    icon: Newspaper,
  },
];

const promptSteps = ["Role", "Context", "Task", "Constraints", "Examples", "Output", "Verify"];

const fieldNotes = [
  ["Hardware", "What physically runs AI?"],
  ["Prompting", "How do I give a model a clean job?"],
  ["Data", "Can this information be trusted?"],
  ["Markets", "Where is money moving?"],
  ["Workflow", "What changes in the real world?"],
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">
      {children}
    </p>
  );
}

function SignalGrid() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.055)_1px,transparent_1px)] bg-[size:56px_56px] opacity-30" />
      <div className="absolute left-1/2 top-20 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full border border-cyan-300/10" />
      <div className="absolute left-1/2 top-32 h-[24rem] w-[24rem] -translate-x-1/2 rounded-full border border-emerald-300/10" />
      <div className="absolute right-[-8rem] top-[-8rem] h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="absolute bottom-[-10rem] left-[-8rem] h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />
    </div>
  );
}

export function GatekptLanding() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#060807] text-white">
      <section className="relative border-b border-white/10 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <SignalGrid />
        <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/8 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-emerald-200">
              <Sparkles className="h-4 w-4" />
              AI field manual
            </div>
            <h1 className="max-w-4xl text-5xl font-black leading-[0.9] sm:text-6xl lg:text-7xl">
              Learn the stack. Track the signal. Build the reps.
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-white/68">
              GateKPT is a public notebook for AI from the ground up: hardware, data,
              models, prompting, engineering, markets, and real deployment.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.5, ease: "easeOut" }}
            className="rounded-lg border border-white/10 bg-white/[0.045] p-4 shadow-2xl shadow-black/40 backdrop-blur"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">Signal Room</p>
                <p className="mt-1 text-sm font-semibold text-white/58">Groundwork for the AI era</p>
              </div>
              <Activity className="h-6 w-6 text-emerald-300" />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {fieldNotes.map(([label, question]) => (
                <div key={label} className="rounded-md border border-white/10 bg-black/30 p-3">
                  <p className="text-sm font-black text-white">{label}</p>
                  <p className="mt-1 text-xs font-medium leading-5 text-white/52">{question}</p>
                </div>
              ))}
              <div className="rounded-md border border-cyan-300/20 bg-cyan-300/10 p-3">
                <p className="text-sm font-black text-cyan-100">Next brief</p>
                <p className="mt-1 text-xs font-medium leading-5 text-cyan-100/62">
                  News, simplified, mapped to the stack.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="stack" className="relative px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
            <div>
              <SectionLabel>Stack map</SectionLabel>
              <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
                AI is a system, not a single product.
              </h2>
            </div>
            <p className="max-w-2xl text-sm font-medium leading-6 text-white/58">
              The site breaks AI into physical compute, trusted data, model behavior,
              deployment patterns, cost, risk, and business outcomes.
            </p>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stackLayers.map((layer) => (
              <article
                key={layer.title}
                className={`rounded-lg border bg-gradient-to-b ${layer.tint} p-5 backdrop-blur`}
              >
                <div className="mb-8 flex items-center justify-between">
                  <layer.icon className="h-6 w-6" />
                  <span className="rounded-full border border-current/20 px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] opacity-75">
                    {layer.signal}
                  </span>
                </div>
                <h3 className="text-xl font-black text-white">{layer.title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/62">{layer.subtitle}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="tracks" className="border-y border-white/10 bg-white/[0.035] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div className="max-w-3xl">
              <SectionLabel>Training tracks</SectionLabel>
              <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
                A living curriculum, built like reps.
              </h2>
            </div>
            <p className="max-w-md text-sm font-medium leading-6 text-white/58">
              The website is the durable base. LinkedIn becomes the distribution layer.
            </p>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {learningTracks.map((track) => (
              <article key={track.title} className="group rounded-lg border border-white/10 bg-black/26 p-5 transition hover:border-emerald-300/35 hover:bg-emerald-300/5">
                <track.icon className="h-6 w-6 text-emerald-200" />
                <h3 className="mt-4 text-lg font-black">{track.title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/58">{track.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="prompting" className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <SectionLabel>Prompt lab</SectionLabel>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
              Prompting is how you turn intent into usable work.
            </h2>
            <p className="mt-5 text-base font-medium leading-7 text-white/62">
              A strong prompt gives the model context, boundaries, examples, output structure,
              and a way to check whether the answer is trustworthy.
            </p>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
            <div className="flex flex-wrap gap-2">
              {promptSteps.map((step) => (
                <span key={step} className="rounded-md border border-emerald-300/20 bg-emerald-300/8 px-3 py-2 text-sm font-black text-emerald-100">
                  {step}
                </span>
              ))}
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-red-300/20 bg-red-300/8 p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-red-200">Loose</p>
                <p className="mt-3 text-sm font-semibold text-white/72">Explain GPUs.</p>
              </div>
              <div className="rounded-lg border border-cyan-300/20 bg-cyan-300/8 p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-200">Structured</p>
                <p className="mt-3 text-sm font-semibold leading-6 text-white/72">
                  Explain what a GPU does in AI to a beginner software engineer. Compare it to a CPU,
                  explain why memory bandwidth matters, and give one LLM training example.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="brief" className="relative border-t border-white/10 px-4 py-12 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionLabel>Weekly brief</SectionLabel>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
              Research once. Publish clearly. Keep the foundation.
            </h2>
            <p className="mt-5 text-base font-medium leading-7 text-white/62">
              Each week starts with news, then turns into simplified notes, technical concepts,
              market context, and posts that point back to the hub.
            </p>
          </div>
          <div className="grid gap-3">
            {[
              [Newspaper, "Collect", "What happened in AI this week?"],
              [Gauge, "Filter", "What is signal and what is noise?"],
              [Map, "Map", "Where does it sit in the stack?"],
              [FileText, "Write", "What evergreen note should exist?"],
              [Zap, "Publish", "What should LinkedIn see?"],
            ].map(([Icon, label, detail]) => (
              <div key={label as string} className="flex items-center gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-cyan-300/12 text-cyan-200">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-white">{label as string}</p>
                  <p className="mt-1 text-xs font-medium text-white/52">{detail as string}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-black/35 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
            <Orbit className="h-6 w-6 text-cyan-200" />
            <h3 className="mt-4 text-lg font-black">Global lens</h3>
            <p className="mt-2 text-sm leading-6 text-white/56">
              AI tracked as technology, market structure, labor shift, and infrastructure buildout.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
            <BadgeDollarSign className="h-6 w-6 text-amber-200" />
            <h3 className="mt-4 text-lg font-black">Market context</h3>
            <p className="mt-2 text-sm leading-6 text-white/56">
              Public companies, private rounds, compute costs, margins, and talent pressure.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
            <Layers3 className="h-6 w-6 text-emerald-200" />
            <h3 className="mt-4 text-lg font-black">Builder notes</h3>
            <p className="mt-2 text-sm leading-6 text-white/56">
              Practical explanations for engineers, beginners, operators, and future projects.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
