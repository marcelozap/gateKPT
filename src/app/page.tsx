import { GatekptLanding } from "@/gatekpt/GatekptLanding";
import { LAYERS } from "@/gatekpt/stack";

export default function Home() {
  return (
    <>
      <GatekptLanding />

      {/* A state machine has no crawlable body text. This carries the full
          seven-layer content for search engines and for anyone without JS.
          Do not ship "/" without it. */}
      <noscript>
        <div style={{ position: "relative", zIndex: 40, maxWidth: 680, margin: "0 auto", padding: "64px 24px", background: "#05070D", color: "#93A0B4", font: "400 17px/1.65 system-ui, sans-serif" }}>
          <h1 style={{ color: "#F4F8FC", fontSize: 34, letterSpacing: "-0.03em", marginBottom: 8 }}>
            GateKPT - the AI stack, mapped end to end.
          </h1>
          <p style={{ marginBottom: 40 }}>
            A public map of the AI stack: power, chips, data, models, software,
            testing, and business. One number and one source per layer.
          </p>
          {LAYERS.map((l) => (
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
