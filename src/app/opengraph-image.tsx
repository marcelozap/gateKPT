import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "XIV - Role-based AI systems.";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#080806",
          color: "#f4efe4",
          display: "flex",
          flexDirection: "column",
          fontFamily: "Arial, sans-serif",
          height: "100%",
          justifyContent: "space-between",
          padding: 72,
          width: "100%",
        }}
      >
        <div
          style={{
            alignItems: "center",
            color: "#8ff0ff",
            display: "flex",
            fontSize: 30,
            fontWeight: 700,
            gap: 18,
            letterSpacing: 0,
          }}
        >
          <span
            style={{
              background: "#f5b84b",
              display: "flex",
              height: 14,
              width: 14,
            }}
          />
          XIV
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 28,
          }}
        >
          <h1
            style={{
              color: "#f4efe4",
              fontSize: 82,
              fontWeight: 800,
              lineHeight: 1,
              margin: 0,
              maxWidth: 920,
            }}
          >
            Role-based AI systems for real work.
          </h1>
          <p
            style={{
              color: "#c9e8e8",
              fontSize: 34,
              lineHeight: 1.24,
              margin: 0,
              maxWidth: 880,
            }}
          >
            XIV is the orchestrator. MaloSound is the proof. Green Machine is the data lane.
          </p>
        </div>
        <div
          style={{
            alignItems: "center",
            borderTop: "1px solid rgba(143, 240, 255, 0.35)",
            color: "#f5b84b",
            display: "flex",
            fontSize: 28,
            justifyContent: "space-between",
            paddingTop: 28,
          }}
        >
          <span>Marcelo Zapata</span>
          <span>XIV / MaloSound / Green Machine</span>
        </div>
      </div>
    ),
    size,
  );
}
