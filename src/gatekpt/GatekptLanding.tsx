"use client";

import { motion } from "framer-motion";
import {
  BadgeDollarSign,
  BrainCircuit,
  BriefcaseBusiness,
  Cpu,
  Database,
  FileText,
  Gauge,
  GraduationCap,
  LineChart,
  Map,
  MessageSquareText,
  Newspaper,
  ShieldCheck,
  Sparkles,
  Workflow,
  Zap,
} from "lucide-react";

const entryPaths = [
  {
    label: "Beginner",
    title: "What is this?",
    detail: "Plain-language foundations before jargon.",
    icon: GraduationCap,
  },
  {
    label: "Engineer",
    title: "How is it built?",
    detail: "Systems, APIs, data, prompts, evals.",
    icon: Workflow,
  },
  {
    label: "Market",
    title: "Why now?",
    detail: "Compute, companies, costs, talent, timing.",
    icon: LineChart,
  },
];

const stackLayers = [
  {
    title: "Compute",
    eyebrow: "Physical",
    detail: "GPUs, memory, networking, data centers, power, cooling.",
    icon: Cpu,
    color: "text-cyan-200",
  },
  {
    title: "Data",
    eyebrow: "Trust",
    detail: "Schemas, pipelines, traceability, quality, governance.",
    icon: Database,
    color: "text-emerald-200",
  },
  {
    title: "Models",
    eyebrow: "Reasoning",
    detail: "Tokens, embeddings, transformers, training, inference.",
    icon: BrainCircuit,
    color: "text-violet-200",
  },
  {
    title: "Deployment",
    eyebrow: "Workflow",
    detail: "APIs, agents, RAG, evals, guardrails, human review.",
    icon: BriefcaseBusiness,
    color: "text-amber-200",
  },
];

const tracks = [
  {
    title: "Prompt Lab",
    detail: "Turn a vague question into a clean model work order.",
    icon: MessageSquareText,
  },
  {
    title: "Risk Controls",
    detail: "Bias, privacy, source attribution, confidence, and review.",
    icon: ShieldCheck,
  },
  {
    title: "Weekly Signal",
    detail: "AI news simplified, organized, and mapped back to fundamentals.",
    icon: Newspaper,
  },
];

const promptSteps = ["Role", "Context", "Task", "Constraints", "Example", "Format", "Check"];

const weeklyFlow = [
  [Newspaper, "Collect", "What actually happened?"],
  [Gauge, "Filter", "What is signal vs noise?"],
  [Map, "Map", "Where does it sit in the stack?"],
  [FileText, "Write", "What evergreen note should exist?"],
  [Zap, "Publish", "What is useful enough to share?"],
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">
      {children}
    </p>
  );
}

function Atmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:64px_64px] opacity-28" />
      <div className="absolute left-[10%] top-[18%] h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="absolute right-[6%] top-[8%] h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="absolute bottom-[-18rem] left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full border border-cyan-300/10" />
      <div className="absolute bottom-[-12rem] left-1/2 h-[25rem] w-[25rem] -translate-x-1/2 rounded-full border border-emerald-300/10" />
    </div>
  );
}

export function GatekptLanding() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#050706] text-white">
      <section className="relative border-b border-white/10 px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <Atmosphere />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:min-h-[35rem] lg:grid-cols-[1fr_0.88fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="max-w-3xl"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/8 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-emerald-200">
              <Sparkles className="h-4 w-4" />
              Interactive AI learning notebook
            </div>
            <h1 className="text-5xl font-black leading-[0.92] sm:text-6xl lg:text-7xl">
              AI, organized for focus.
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-white/68">
              GateKPT breaks the AI era into learnable pieces: hardware, data,
              models, prompting, markets, workflow, and risk.
            </p>
            <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
              {entryPaths.map((path) => (
                <a
                  key={path.label}
                  href="#tracks"
                  className="group rounded-lg border border-white/10 bg-white/[0.045] p-4 transition hover:border-emerald-300/35 hover:bg-emerald-300/8"
                >
                  <path.icon className="h-5 w-5 text-emerald-200" />
                  <p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-white/44">
                    {path.label}
                  </p>
                  <p className="mt-1 text-base font-black text-white">{path.title}</p>
                  <p className="mt-2 text-xs font-medium leading-5 text-white/52">{path.detail}</p>
                </a>
              ))}
            </div>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.5, ease: "easeOut" }}
            className="rounded-lg border border-white/10 bg-[#0d1210]/88 p-5 shadow-2xl shadow-black/50 backdrop-blur"
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">Today&apos;s rep</p>
                <h2 className="mt-3 text-2xl font-black leading-tight">Prompting is not magic.</h2>
                <p className="mt-2 text-sm font-medium leading-6 text-white/58">
                  It is structured communication with a model.
                </p>
              </div>
              <MessageSquareText className="h-7 w-7 shrink-0 text-cyan-200" />
            </div>

            <div className="mt-5 rounded-lg border border-cyan-300/20 bg-cyan-300/8 p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-200">Simple frame</p>
              <p className="mt-3 text-sm font-semibold leading-6 text-white/78">
                Give the model a role, the context, the task, the format, and the way you will check the answer.
              </p>
            </div>

            <div className="mt-5 grid gap-2">
              {["One concept", "One example", "One practice rep"].map((item) => (
                <div key={item} className="flex items-center justify-between rounded-md border border-white/10 bg-black/30 px-3 py-2">
                  <span className="text-sm font-bold text-white/74">{item}</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-300" />
                </div>
              ))}
            </div>
          </motion.aside>
        </div>
      </section>

      <section id="stack" className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-[0.68fr_1.32fr] lg:items-center">
            <div>
              <SectionLabel>Stack map</SectionLabel>
              <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
                Four layers. Then everything else starts making sense.
              </h2>
              <p className="mt-4 text-sm font-medium leading-6 text-white/56">
                Fewer boxes, clearer order: physical infrastructure first, then trusted data,
                then model behavior, then real deployment.
              </p>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
              <div className="grid gap-3 md:grid-cols-4">
                {stackLayers.map((layer, index) => (
                  <article key={layer.title} className="relative rounded-md border border-white/10 bg-black/26 p-4">
                    {index < stackLayers.length - 1 ? (
                      <div className="absolute right-[-0.8rem] top-1/2 z-10 hidden h-px w-6 bg-white/20 md:block" />
                    ) : null}
                    <div className="flex items-center justify-between">
                      <layer.icon className={`h-5 w-5 ${layer.color}`} />
                      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/36">
                        0{index + 1}
                      </span>
                    </div>
                    <p className="mt-5 text-[10px] font-black uppercase tracking-[0.16em] text-white/36">
                      {layer.eyebrow}
                    </p>
                    <h3 className="mt-1 text-lg font-black">{layer.title}</h3>
                    <p className="mt-3 text-xs font-medium leading-5 text-white/54">{layer.detail}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="tracks" className="border-y border-white/10 bg-[#e9e3d4] px-4 py-12 text-[#111] sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">Learning design</p>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
              The brain learns by chunking, not by staring at a wall of options.
            </h2>
            <p className="mt-4 text-sm font-semibold leading-6 text-black/62">
              Every topic should become a small loop: concept, example, rep, check. That is the product idea.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {tracks.map((track) => (
              <article key={track.title} className="rounded-lg border border-black/10 bg-[#f8f4ea] p-5 shadow-sm">
                <track.icon className="h-6 w-6 text-emerald-800" />
                <h3 className="mt-5 text-xl font-black">{track.title}</h3>
                <p className="mt-3 text-sm font-semibold leading-6 text-black/58">{track.detail}</p>
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
              A prompt is a work order.
            </h2>
            <p className="mt-5 text-base font-medium leading-7 text-white/62">
              Prompting gets easier when the model knows who it is, what it has, what to do,
              what to avoid, how to format the answer, and how success will be judged.
            </p>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
            <div className="grid gap-2 sm:grid-cols-7">
              {promptSteps.map((step, index) => (
                <div key={step} className="rounded-md border border-emerald-300/20 bg-emerald-300/8 p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-200">
                    0{index + 1}
                  </p>
                  <p className="mt-2 text-sm font-black text-white">{step}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-lg border border-cyan-300/20 bg-cyan-300/8 p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-200">Better prompt</p>
              <p className="mt-3 text-sm font-semibold leading-6 text-white/74">
                Explain what a GPU does in AI to a beginner software engineer. Compare it to a CPU,
                explain why memory bandwidth matters, and give one LLM training example.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="brief" className="border-t border-white/10 bg-black/35 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionLabel>Weekly brief</SectionLabel>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
              Research once. Publish clearly. Keep the foundation.
            </h2>
            <p className="mt-5 text-base font-medium leading-7 text-white/62">
              The weekly workflow turns news into a cleaner map: what happened, why it matters,
              what to learn, and what is safe to share publicly.
            </p>
          </div>
          <div className="grid gap-3">
            {weeklyFlow.map(([Icon, label, detail]) => (
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

      <section className="border-t border-white/10 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
            <Sparkles className="h-6 w-6 text-emerald-200" />
            <h3 className="mt-4 text-lg font-black">Interactive learning</h3>
            <p className="mt-2 text-sm leading-6 text-white/56">
              Concepts should invite action: read, test, compare, and explain back.
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
            <Workflow className="h-6 w-6 text-cyan-200" />
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
