"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check, Music2, Play, Sparkles } from "lucide-react";

const offers = [
  {
    name: "Voice OS",
    price: "Training",
    text: "Warmups, breath, tone, confidence, and take notes that stay connected to the song.",
  },
  {
    name: "Creator App",
    price: "C#/.NET",
    text: "A focused desktop workspace for lyrics, takes, captions, visual ideas, routing, and export memory.",
  },
  {
    name: "Video Pipeline",
    price: "Release",
    text: "Captions, live visuals, projector tests, social clips, and release-ready video direction.",
  },
];

const points = [
  "Built as a native C#/.NET desktop app so the creative workspace can be fast, local, and personal.",
  "Designed to reduce the need to live inside Logic, Pro Tools, or a giant DAW just to start creating.",
  "The private app keeps the real production memory: lyrics, takes, captions, visuals, routing, and exports.",
];

const systemSignals = [
  "Drums -> harmony -> vocals",
  "Lyrics become captions",
  "Visuals follow the song",
  "C# desktop Music OS",
];

const creators = [
  "Singers building songs around their voice",
  "Loop artists using Focusrite, RC-505, keys, guitar, and drums",
  "Video creators who need captions, visuals, and export flow",
  "Independent producers who want less setup and more finished work",
];

const stack = [
  "Native C#/.NET desktop app",
  "Local-first creative memory",
  "Audio-interface aware routing",
  "Caption and video workflow",
  "Visualizer and projector planning",
  "Future DAW bridge instead of DAW dependency",
];

const modules = [
  {
    name: "Song Builder",
    label: "Arrange",
    text: "Start with drums, then harmony, then vocals. Keep the song map visible while the idea is still alive.",
  },
  {
    name: "Lyric Vault",
    label: "Write",
    text: "Store hooks, fragments, verses, voice notes, and rewrite directions inside the same project.",
  },
  {
    name: "Caption Engine",
    label: "Video",
    text: "Turn lyrics and spoken ideas into clean caption drafts before the edit becomes painful.",
  },
  {
    name: "Visual Room",
    label: "Live",
    text: "Plan projector looks, visualizer presets, blackout behavior, and room-safe performance modes.",
  },
  {
    name: "Rig Routing",
    label: "Hardware",
    text: "Remember Focusrite, RC-505, mic, loop, keys, guitar, and monitoring notes for each setup.",
  },
  {
    name: "Export Memory",
    label: "Finish",
    text: "Track what is done, what needs a bounce, what needs captions, and what is ready to post.",
  },
];

export function GatekptLanding() {
  return (
    <div className="min-h-screen bg-[#090806] text-[#f8f0e5]">
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(9,8,6,0.92), rgba(9,8,6,0.66) 48%, rgba(9,8,6,0.92)), url('https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1800&q=80') center/cover",
          }}
        />

        <div className="relative mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="max-w-4xl"
          >
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.24em] text-[#f1c27d] shadow-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-[#f1c27d]" />
              GateKPT Music OS
            </div>

            <h1 className="max-w-5xl text-6xl font-black leading-[0.88] tracking-[-0.075em] sm:text-7xl lg:text-[8.2rem]">
              Create without wrestling the studio.
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-white/72 sm:text-xl">
              GateKPT is a C#/.NET Music OS for creators who want to move from
              voice, drums, lyrics, captions, visuals, and video faster without
              making Logic or Pro Tools the center of every idea.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="#early-access"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#f8f0e5] px-6 py-3 text-sm font-black uppercase tracking-[0.13em] text-[#15120d] shadow-[0_18px_45px_rgba(0,0,0,0.32)] transition hover:-translate-y-0.5 hover:bg-white"
              >
                Join early access
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </a>
              <a
                href="#videos"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/18 bg-black/28 px-6 py-3 text-sm font-bold text-white/78 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                <Play className="h-4 w-4" />
                Watch the arc
              </a>
            </div>

            <div className="mt-10 grid max-w-3xl gap-2 sm:grid-cols-2">
              {systemSignals.map((signal) => (
                <div
                  key={signal}
                  className="rounded-2xl border border-white/12 bg-black/30 px-4 py-3 text-sm font-semibold text-white/82 backdrop-blur"
                >
                  {signal}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.6, ease: "easeOut" }}
            className="mt-16 grid gap-4 lg:grid-cols-[1fr_0.82fr]"
          >
            <div className="rounded-[2rem] border border-white/10 bg-black/72 p-6 text-[#f8f0e5] shadow-[0_26px_75px_rgba(0,0,0,0.38)] backdrop-blur sm:p-8">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#f1c27d]">Public Surface</p>
              <h2 className="mt-4 max-w-2xl text-4xl font-black leading-[0.95] tracking-[-0.055em] sm:text-5xl">
                The point is simple: help people create.
              </h2>
              <div className="mt-8 space-y-4">
                {points.map((point) => (
                  <div key={point} className="flex gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f1c27d] text-[#15120d]">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                    <p className="text-sm leading-6 text-white/72">{point}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/12 bg-white/10 p-6 shadow-[0_18px_55px_rgba(0,0,0,0.22)] backdrop-blur sm:p-8">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#f1c27d]">Private App</p>
              <h2 className="mt-4 text-3xl font-black leading-none tracking-[-0.055em] text-white">
                A creator app, not another bloated DAW.
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/68">
                The private Music OS is being built as a C# desktop app around the way creators
                actually work: capture the idea, build the layers, shape the voice, generate captions,
                prepare visuals, and export the moment. It is not trying to copy every studio feature
                in Logic or Pro Tools. It is trying to remove the friction that stops people from making.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="bg-[#15120d] px-4 py-16 text-[#f8f0e5] sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[0.78fr_1fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#f1c27d]">Who It Is For</p>
            <h2 className="mt-3 text-4xl font-black leading-none tracking-[-0.06em] sm:text-5xl">
              Built for creators who need momentum.
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/62">
              GateKPT is for the moment before the studio gets complicated: the lyric,
              the loop, the take, the caption, the visual, and the export.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {creators.map((creator) => (
              <div
                key={creator}
                className="rounded-[1.5rem] border border-white/10 bg-black/24 p-5 text-sm font-semibold leading-6 text-white/78"
              >
                {creator}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f6f0e7] px-4 py-16 text-[#15120d] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-7 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#8d5631]">Inside The Music OS</p>
              <h2 className="mt-3 max-w-3xl text-4xl font-black leading-none tracking-[-0.06em] sm:text-5xl">
                One workspace for the parts that normally scatter everywhere.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-7 text-[#62533f]">
              The app is built around the creator loop: catch the idea, build the layers,
              make the video legible, and remember what still needs to be finished.
            </p>
          </div>

          <div className="rounded-[2rem] border border-[#15120d]/10 bg-[#15120d] p-3 shadow-[0_26px_75px_rgba(65,48,28,0.18)]">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {modules.map((module) => (
                <article
                  key={module.name}
                  className="group min-h-[14rem] rounded-[1.5rem] border border-white/10 bg-[#211b13] p-5 text-[#f8f0e5] transition duration-300 hover:-translate-y-1 hover:border-[#f1c27d]/45 hover:bg-[#2b2217]"
                >
                  <div className="mb-8 inline-flex rounded-full bg-[#f1c27d] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#15120d]">
                    {module.label}
                  </div>
                  <h3 className="text-3xl font-black tracking-[-0.055em]">{module.name}</h3>
                  <p className="mt-4 text-sm leading-7 text-white/64">{module.text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-[#f6f0e7] px-4 py-16 text-[#15120d] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#8d5631]">Offer</p>
              <h2 className="mt-2 text-4xl font-black tracking-[-0.06em] sm:text-5xl">Voice, app, videos.</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-[#62533f]">
              The landing page explains the product. The Music OS does the private work:
              song building, captioning, visual planning, and creation without DAW overload.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {offers.map((offer) => (
              <article
                key={offer.name}
                className="rounded-[1.75rem] border border-[#15120d]/10 bg-white/50 p-6 shadow-[0_18px_55px_rgba(65,48,28,0.10)] backdrop-blur"
              >
                <div className="mb-7 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#15120d] text-[#f8f0e5]">
                  <Music2 className="h-5 w-5" />
                </div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#8d5631]">{offer.price}</p>
                <h3 className="mt-2 text-3xl font-black tracking-[-0.055em]">{offer.name}</h3>
                <p className="mt-4 text-sm leading-7 text-[#62533f]">{offer.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0f0d09] px-4 py-16 text-[#f8f0e5] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(241,194,125,0.18),transparent_34%),rgba(255,255,255,0.04)] p-6 shadow-[0_26px_75px_rgba(0,0,0,0.28)] sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.86fr_1fr] lg:items-end">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#f1c27d]">Technical Stack</p>
              <h2 className="mt-3 text-4xl font-black leading-none tracking-[-0.06em] sm:text-5xl">
                Serious app architecture, simple creator surface.
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/64">
                The long-term product is not a web toy. It is a native Music OS that can
                sit beside the creator rig, remember the session, and eventually talk to
                pro tools when needed without forcing every idea through them first.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {stack.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-black/28 px-4 py-3 text-sm font-bold text-white/78"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="videos" className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-[#15120d]/10 bg-[#e9ddcc] p-6 sm:p-8">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#8d5631]">Videos</p>
          <h2 className="mt-3 text-4xl font-black leading-none tracking-[-0.06em] sm:text-5xl">
            TikTok is distribution. The videos become proof.
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#62533f]">
            This section becomes the media wall: vocal demos, song fragments,
            visualizer clips, live projector tests, behind-the-scenes builds, and release-ready videos.
          </p>
        </div>
      </section>

      <section id="early-access" className="bg-[#f6f0e7] px-4 pb-20 text-[#15120d] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-[2rem] bg-[#15120d] p-6 text-[#f8f0e5] shadow-[0_26px_75px_rgba(65,48,28,0.18)] sm:p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#f1c27d]">Early Access</p>
              <h2 className="mt-3 max-w-3xl text-4xl font-black leading-none tracking-[-0.06em] sm:text-5xl">
                The first version is for creators who want to finish more work.
              </h2>
            </div>
            <a
              href="mailto:hello@gatekpt.ai?subject=GateKPT%20Music%20OS%20Early%20Access"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#f1c27d] px-6 py-3 text-sm font-black uppercase tracking-[0.13em] text-[#15120d] transition hover:-translate-y-0.5 hover:bg-[#ffd99b]"
            >
              Request access
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-white/64">
            Start with voice, lyrics, captions, video, and visual planning. Keep the DAW for
            deep engineering when you need it. Use GateKPT to get the idea moving first.
          </p>
        </div>
      </section>
    </div>
  );
}
