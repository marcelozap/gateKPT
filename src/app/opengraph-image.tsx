import { ImageResponse } from "next/og";
import { LAYERS } from "@/gatekpt/stack";

export const runtime = "nodejs";
export const alt = "GateKPT - the AI stack, mapped end to end.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          backgroundColor: "#05070D",
          backgroundImage: [
            "radial-gradient(720px 620px at 88% 8%, rgba(125,249,255,0.20), transparent 62%)",
            "radial-gradient(640px 560px at 6% 96%, rgba(255,45,149,0.17), transparent 64%)",
            "radial-gradient(560px 520px at 34% 46%, rgba(139,92,246,0.15), transparent 68%)",
            "radial-gradient(300px 280px at 82% 84%, rgba(255,176,32,0.10), transparent 66%)",
          ].join(","),
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1200,
            height: 2,
            backgroundImage:
              "linear-gradient(90deg, transparent, #7DF9FF 26%, #E4FDFF 50%, #7DF9FF 74%, transparent)",
          }}
        />

        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: "#7DF9FF",
              marginRight: 14,
            }}
          />
          <div
            style={{
              fontSize: 22,
              letterSpacing: 6,
              color: "#F4F8FC",
              fontWeight: 600,
            }}
          >
            GATEKPT
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 78,
              lineHeight: 1.05,
              letterSpacing: -3,
              color: "#F4F8FC",
              fontWeight: 600,
              maxWidth: 900,
            }}
          >
            The AI stack, mapped end to end.
          </div>
          <div
            style={{
              marginTop: 26,
              fontSize: 27,
              lineHeight: 1.45,
              color: "#93A0B4",
              maxWidth: 760,
            }}
          >
            Power, chips, data, models, software, testing, and business.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex" }}>
            {LAYERS.map((layer) => (
              <div
                key={layer.id}
                style={{
                  display: "flex",
                  fontSize: 17,
                  letterSpacing: 2,
                  color: "#6B7A94",
                  border: "1px solid #222C40",
                  borderRadius: 2,
                  padding: "7px 13px",
                  marginRight: 9,
                }}
              >
                {layer.id}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 20, letterSpacing: 2, color: "#2BA8C4" }}>
            gatekpt.ai
          </div>
        </div>
      </div>
    ),
    size,
  );
}
