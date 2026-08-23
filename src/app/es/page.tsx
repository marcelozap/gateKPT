import { SpanishDocumentGuard } from "@/components/SpanishDocumentGuard";
import type { Metadata } from "next";
import { GatekptHome } from "@/gatekpt/GatekptHome";
import { layersEs } from "@/gatekpt/content";
import { getSiteUrl } from "@/lib/siteUrl";

export const metadata: Metadata = {
  title: {
    absolute: "Marcelo Zapata - IA, Machine Learning e Ingeniería de Datos",
  },
  description:
    "GateKPT es la superficie pública de IA, machine learning e ingeniería de datos de Marcelo Zapata: sistemas LLM, mapas de señales visuales, contratos de datos y notas.",
  alternates: {
    canonical: `${getSiteUrl()}/es`,
  },
};

function NoScriptStack() {
  return (
    <div className="gki-noscript">
      <h1>GateKPT - IA desde el texto hacia afuera.</h1>
      <p>
        Escritura publicada y un mapa para entender qué pasa cuando escribes: entrada, tokens, contexto, modelos,
        herramientas, chips y energía.
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
    <div lang="es" translate="no">
      <SpanishDocumentGuard />
      <GatekptHome locale="es" />
      <noscript>
        <NoScriptStack />
      </noscript>
    </div>
  );
}
