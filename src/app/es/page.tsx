import { SpanishDocumentGuard } from "@/components/SpanishDocumentGuard";
import type { Metadata } from "next";
import { AudioProofGateway } from "@/gatekpt/AudioProofGateway";
import { layersEs } from "@/gatekpt/content";
import { getSiteUrl } from "@/lib/siteUrl";

export const metadata: Metadata = {
  title: {
    absolute: "XIV - Sistemas de IA basados en roles",
  },
  description:
    "XIV es el orquestador. MaloSound es la prueba. Green Machine es la línea de datos y revisión de riesgo.",
  alternates: {
    canonical: `${getSiteUrl()}/es`,
    languages: {
      en: getSiteUrl(),
      es: `${getSiteUrl()}/es`,
    },
  },
  openGraph: {
    title: "XIV - Sistemas de IA basados en roles",
    description:
      "XIV es el orquestador. MaloSound es la prueba. Green Machine es la línea de datos y revisión de riesgo.",
    type: "website",
    url: `${getSiteUrl()}/es`,
    images: [
      {
        url: `${getSiteUrl()}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "XIV en español: orquestación, MaloSound y Green Machine.",
      },
    ],
  },
};

function NoScriptStack() {
  return (
    <div className="gki-noscript">
      <h1>XIV - Sistemas de IA basados en roles.</h1>
      <p>
        XIV es el orquestador. MaloSound es la prueba. Green Machine es la línea de datos y revisión de riesgo.
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
      <AudioProofGateway locale="es" />
      <noscript>
        <NoScriptStack />
      </noscript>
    </div>
  );
}
