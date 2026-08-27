import type { Metadata } from "next";
import Link from "next/link";
import { HubNav } from "@/components/HubNav";
import { getSiteUrl } from "@/lib/siteUrl";

export const metadata: Metadata = {
  title: "MaloSound",
  description:
    "MaloSound is the original music and artist-tech proof of concept for XIV: audio analysis, coded rhythm, visual motion, and release workflow.",
  alternates: {
    canonical: `${getSiteUrl()}/malosound`,
  },
};

export default function MaloSoundPage() {
  return (
    <div className="gkl-page">
      <div className="gkl-atmos" aria-hidden="true" />
      <HubNav />
      <main className="gkl-shell gkl-shell-narrow">
        <article className="gkl-article">
          <span className="gkl-meta gki-mono">MALOSOUND / PROOF OF CONCEPT</span>
          <h1>MaloSound</h1>
          <p className="gkl-summary">
            Original music and artist-tech infrastructure. MaloSound proves the XIV model through a workflow the
            artist controls end to end.
          </p>
          <div className="gkl-body">
            <p>
              The current public lane is deliberately narrow and safe: original audio, AudioAnalysisV1 JSON, coded
              rhythm sketches, visual output, and signal-mapped motion.
            </p>
            <p>
              The goal is not to claim that AI understands music. The goal is to show how sound, code, motion,
              publishing, feedback, and ownership can connect inside one repeatable system.
            </p>
            <p>
              This is the first proof because music gives the whole workflow: creation, production, analysis,
              visuals, release, response, and memory.
            </p>
          </div>
          <div className="gkl-artifacts" aria-label="MaloSound links">
            <Link href="/log/coding-beats">Coding Beats</Link>
            <Link href="/log">Public log</Link>
            <Link href="/">Motion gateway</Link>
          </div>
        </article>
      </main>
    </div>
  );
}
