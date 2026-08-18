import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "NOTE Nº 002 - The Trap of Time - gatekpt.ai";
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
          color: "#f7f0df",
          display: "flex",
          flexDirection: "column",
          fontFamily: "Georgia, serif",
          height: "100%",
          justifyContent: "space-between",
          padding: 74,
          width: "100%",
        }}
      >
        <div
          style={{
            alignItems: "center",
            color: "#8ff0ff",
            display: "flex",
            fontFamily: "Arial, sans-serif",
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
          NOTE Nº 002
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          <h1
            style={{
              color: "#f7f0df",
              fontSize: 92,
              fontWeight: 700,
              lineHeight: 1.02,
              margin: 0,
              maxWidth: 930,
            }}
          >
            The Trap of Time
          </h1>
          <p
            style={{
              color: "#d9e7df",
              fontFamily: "Arial, sans-serif",
              fontSize: 32,
              lineHeight: 1.3,
              margin: 0,
              maxWidth: 900,
            }}
          >
            A note on time, identity, and using AI to test your limits.
          </p>
        </div>
        <div
          style={{
            alignItems: "center",
            borderTop: "1px solid rgba(143, 240, 255, 0.35)",
            color: "#f5b84b",
            display: "flex",
            fontFamily: "Arial, sans-serif",
            fontSize: 28,
            justifyContent: "space-between",
            paddingTop: 28,
          }}
        >
          <span>gatekpt.ai</span>
          <span>Marcelo Zapata</span>
        </div>
      </div>
    ),
    size,
  );
}
