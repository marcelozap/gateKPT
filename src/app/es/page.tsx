import type { Metadata } from "next";
import { GatekptLanding } from "@/gatekpt/GatekptLanding";
import { LAYERS_ES } from "@/gatekpt/stack";

export const metadata: Metadata = {
  title: "GateKPT - IA desde la capa fisica hacia arriba",
  description:
    "Un diario publico de investigacion sobre IA: energia, chips, datos, modelos, software, pruebas y contexto.",
};

export default function SpanishHome() {
  return (
    <>
      <GatekptLanding locale="es" />

      <noscript>
        <div style={{ position: "relative", zIndex: 40, maxWidth: 680, margin: "0 auto", padding: "64px 24px", background: "#05070D", color: "#93A0B4", font: "400 17px/1.65 system-ui, sans-serif" }}>
          <h1 style={{ color: "#F4F8FC", fontSize: 34, letterSpacing: "-0.03em", marginBottom: 8 }}>
            GateKPT - IA desde la capa fisica hacia arriba.
          </h1>
          <p style={{ marginBottom: 40 }}>
            Un diario publico de investigacion sobre IA: energia, chips,
            datos, modelos, software, pruebas y contexto.
          </p>
          {LAYERS_ES.map((l) => (
            <section key={l.id} style={{ marginBottom: 32 }}>
              <h2 style={{ color: "#F4F8FC", fontSize: 20, marginBottom: 6 }}>
                {l.id} - {l.name}
              </h2>
              <p style={{ marginBottom: 6 }}>{l.essence}</p>
              <p style={{ marginBottom: 6 }}>
                <strong style={{ color: "#F4F8FC" }}>{l.fig}{l.unit}</strong> - {l.figcap}
              </p>
              <p style={{ marginBottom: 6 }}>
                <a href={l.srcUrl} style={{ color: "#7DF9FF" }}>{l.src}</a>
              </p>
              <p dangerouslySetInnerHTML={{ __html: l.brk }} />
            </section>
          ))}
        </div>
      </noscript>
    </>
  );
}
