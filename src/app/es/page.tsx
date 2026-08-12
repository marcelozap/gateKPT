import type { Metadata } from "next";
import { GatekptLanding } from "@/gatekpt/GatekptLanding";
import { layersEs } from "@/gatekpt/content";
import { getSiteUrl } from "@/lib/siteUrl";

export const metadata: Metadata = {
  title: "GateKPT - IA Desde la Capa Fisica",
  description:
    "Un diario publico para entender el stack de IA: energia, chips, datos, modelos, software, pruebas y contexto.",
  alternates: {
    canonical: `${getSiteUrl()}/es`,
  },
};

function NoScriptStack() {
  return (
    <div className="gki-noscript">
      <h1>GateKPT - IA desde la capa fisica.</h1>
      <p>
        Un diario publico para entender que hace funcionar la IA moderna: energia, chips, datos, modelos, software,
        pruebas y contexto.
      </p>
      {layersEs.map((layer) => (
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

export default function SpanishHome() {
  return (
    <>
      <GatekptLanding locale="es" />
      <noscript>
        <NoScriptStack />
      </noscript>
    </>
  );
}
