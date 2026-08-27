import type { Metadata } from "next";
import { HubNav } from "@/components/HubNav";
import { getSiteUrl } from "@/lib/siteUrl";

export const metadata: Metadata = {
  title: "Green Machine",
  description:
    "Green Machine is a data, evidence, and risk-review lane for market data pipelines, receipts, tested boundaries, and structured research.",
  alternates: {
    canonical: `${getSiteUrl()}/green-machine`,
  },
};

export default function GreenMachinePage() {
  return (
    <div className="gkl-page">
      <div className="gkl-atmos" aria-hidden="true" />
      <HubNav />
      <main className="gkl-shell gkl-shell-narrow">
        <article className="gkl-article">
          <span className="gkl-meta gki-mono">GREEN MACHINE / DATA LANE</span>
          <h1>Green Machine</h1>
          <p className="gkl-summary">
            Data, evidence, and risk review. Green Machine is the quantitative lane for structured research and
            audit trails.
          </p>
          <div className="gkl-body">
            <p>
              The defensible surface is data engineering: market-data pipelines, evidence review, hash-backed receipts,
              tested risk boundaries, and clear research records.
            </p>
            <p>
              This is not an investment advisory product, trading bot, signal service, broker router, or
              managed-account system. The work is about assumptions, evidence, risk context, and disciplined review.
            </p>
            <p>
              Inside the XIV ecosystem, Green Machine stays separate from MaloSound so financial research claims do not
              blur into creative or agentic workflow claims.
            </p>
          </div>
        </article>
      </main>
    </div>
  );
}
