import type { Metadata } from "next";
import Link from "next/link";
import { HubNav } from "@/components/HubNav";
import { getSiteUrl } from "@/lib/siteUrl";

export const metadata: Metadata = {
  title: "XIV",
  description:
    "XIV is role-based AI orchestration for real work: specialist agents, shared timelines, receipts, evaluation, and workflow execution.",
  alternates: {
    canonical: `${getSiteUrl()}/xiv`,
  },
};

export default function XivPage() {
  return (
    <div className="gkl-page">
      <div className="gkl-atmos" aria-hidden="true" />
      <HubNav />
      <main className="gkl-shell gkl-shell-narrow">
        <article className="gkl-article">
          <span className="gkl-meta gki-mono">XIV / ORCHESTRATOR</span>
          <h1>XIV</h1>
          <p className="gkl-summary">
            Role-based AI orchestration for real work. XIV coordinates specialist agents, role contracts, shared
            timelines, memory, receipts, evaluation, and repeatable workflow execution.
          </p>
          <div className="gkl-body">
            <p>
              The point is to build AI around the actual job instead of handing everyone the same blank tool.
              A specialist system should know the context, the files, the review steps, and what done looks like.
            </p>
            <p>
              MaloSound is the music system: original music, coded rhythm, audio analysis, visual motion,
              publishing workflow, feedback, and ownership connected end to end.
            </p>
            <p>
              The public technical implementation lives in role-systems. It is the code layer for role contracts,
              orchestration patterns, schemas, examples, and tests.
            </p>
          </div>
          <div className="gkl-artifacts" aria-label="XIV links">
            <Link href="/malosound">MaloSound</Link>
            <Link href="/log/fourteen">Read Fourteen</Link>
            <a href="https://github.com/marcelozap/role-systems">role-systems repo</a>
          </div>
        </article>
      </main>
    </div>
  );
}
