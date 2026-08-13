import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HubNav } from "@/components/HubNav";
import { note001 } from "@/gatekpt/content";
import { getSiteUrl } from "@/lib/siteUrl";

export const metadata: Metadata = {
  title: "Diario",
  description: "Escritura de Marcelo Zapata sobre IA, sistemas, curiosidad y el mundo alrededor del modelo.",
  alternates: {
    canonical: `${getSiteUrl()}/es/log`,
  },
};

export default function SpanishLogPage() {
  return (
    <div className="gkl-page">
      <div className="gkl-atmos" aria-hidden="true" />
      <HubNav locale="es" />
      <main className="gkl-shell">
        <section className="gkl-hero" aria-labelledby="field-log-title">
          <div className="gkl-hero-copy">
            <span className="gki-kicker gki-mono">GateKPT / Diario</span>
            <h1 id="field-log-title">Escritura sobre el sistema debajo de la IA.</h1>
            <p>
              Esta es la capa de escritura de GateKPT: notas personales que conectan la tecnologia con la atencion,
              el trabajo y el mundo fisico alrededor.
            </p>
          </div>
          <figure className="gkl-hero-media">
            <Image
              src="/gatekpt-field-log-hero.png"
              alt="Una persona con una tableta y una raqueta caminando por una ciudad lluviosa de noche"
              width={1785}
              height={881}
              priority
            />
          </figure>
        </section>

        <section className="gkl-start" aria-labelledby="gkl-start-title">
          <div>
            <span className="gkl-label gki-mono">Empieza aqui</span>
            <h2 id="gkl-start-title">Una nota esta publicada.</h2>
            <p>
              Lee primero la nota mas reciente. El mapa del stack es el sistema detras del sitio; el diario es donde
              entran las preguntas humanas.
            </p>
          </div>
          <Link href="/notes/wall-e" className="gkl-primary">
            Leer la nota completa <span aria-hidden="true">-&gt;</span>
          </Link>
        </section>

        <section className="gkl-list" aria-labelledby="gkl-list-title">
          <div className="gkl-list-head">
            <h2 id="gkl-list-title">Escritura publicada</h2>
            <span className="gkl-label gki-mono">01 nota</span>
          </div>
          <Link href="/notes/wall-e" className="gkl-entry gkl-entry-featured">
            <div className="gkl-entry-meta gki-mono">
              <span>{note001.publishedTime.slice(0, 10)}</span>
              <span>{note001.displayKicker}</span>
            </div>
            <div className="gkl-entry-copy">
              <h3>{note001.title}</h3>
              <p>{note001.description}</p>
              <span className="gkl-read">Abrir Nota 001 <span aria-hidden="true">-&gt;</span></span>
            </div>
          </Link>
        </section>
      </main>
    </div>
  );
}
