import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HubNav } from "@/components/HubNav";
import { note001 } from "@/gatekpt/content";
import { getSiteUrl } from "@/lib/siteUrl";

export const metadata: Metadata = {
  title: "Escritura publicada",
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
        <section className="gkl-hero" aria-labelledby="writing-title">
          <div className="gkl-hero-copy">
            <span className="gki-kicker gki-mono">GateKPT / Escritura publicada</span>
            <h1 id="writing-title">Escritura publicada.</h1>
            <p>
              Notas que conectan la tecnologia con la atencion, el trabajo, la identidad y el mundo fisico alrededor
              del modelo.
            </p>
          </div>
          <figure className="gkl-hero-media">
            <Image
              src="/brand/xiv-holy-grail-reference.png"
              alt="Un collage de ciudad neon con una figura usando un visor encendido"
              width={1680}
              height={945}
              priority
            />
          </figure>
        </section>

        <section className="gkl-start" aria-labelledby="gkl-start-title">
          <div>
            <span className="gkl-label gki-mono">Empieza aqui</span>
            <h2 id="gkl-start-title">Empieza con la nota mas nueva.</h2>
            <p>
              Lee primero la nota mas reciente. Despues usa las capas de IA para conectar las preguntas humanas con
              el sistema debajo de ellas.
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
