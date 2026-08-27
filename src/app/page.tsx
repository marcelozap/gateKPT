import type { Metadata } from "next";
import { AudioProofGateway } from "@/gatekpt/AudioProofGateway";
import { layersEn } from "@/gatekpt/content";
import { getSiteUrl } from "@/lib/siteUrl";

export const metadata: Metadata = {
  alternates: {
    canonical: getSiteUrl(),
    languages: {
      en: getSiteUrl(),
      es: `${getSiteUrl()}/es`,
    },
  },
};

function NoScriptStack() {
  return (
    <div className="gki-noscript">
      <h1>XIV - Role-based AI systems.</h1>
      <p>
        XIV is the orchestrator. MaloSound is the proof. Green Machine is the data and risk-review lane.
      </p>
      {layersEn.map((layer) => (
        <section key={layer.id}>
          <h2>
            {layer.id} - {layer.name}
          </h2>
          <p>{layer.essence}</p>
          <p>
            <strong>
              {layer.fig}
              {layer.unit}
            </strong>{" "}
            - {layer.figcap}
          </p>
          <p>
            <a href={layer.srcUrl}>{layer.src}</a>
          </p>
          <p dangerouslySetInnerHTML={{ __html: layer.brk }} />
        </section>
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <>
      <AudioProofGateway />
      <noscript>
        <NoScriptStack />
      </noscript>
    </>
  );
}
