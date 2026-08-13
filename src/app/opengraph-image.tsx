import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "GateKPT - AI from the text box out.";
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
          GATEKPT
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
            AI from the text box out.
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
            Input, tokens, context, models, tools, chips, and power.
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
          <span>gatekpt.ai</span>
          <span>L01 - L07</span>
        </div>
      </div>
    ),
    size,
  );
}
