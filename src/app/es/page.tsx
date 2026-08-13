import type { Metadata } from "next";
import { GatekptLanding } from "@/gatekpt/GatekptLanding";
import { layersEs } from "@/gatekpt/content";
import { getSiteUrl } from "@/lib/siteUrl";

export const metadata: Metadata = {
  title: "GateKPT - IA Desde el Texto Hacia Afuera",
  description:
    "Escritura publicada y un mapa publico de las capas de IA: entrada, tokens, contexto, modelos, herramientas, chips y energia.",
  alternates: {
    canonical: `${getSiteUrl()}/es`,
  },
};

function NoScriptStack() {
  return (
    <div className="gki-noscript">
      <h1>GateKPT - IA desde el texto hacia afuera.</h1>
      <p>
        Escritura publicada y un mapa para entender que pasa cuando escribes: entrada, tokens, contexto, modelos,
        herramientas, chips y energia.
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
