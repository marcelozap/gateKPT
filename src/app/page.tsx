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
      <h1>GateKPT - AI from the text box out.</h1>
      <p>
        Journal entries and a public map of the AI layers: input, tokens, context, models, tools, chips, and power.
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
