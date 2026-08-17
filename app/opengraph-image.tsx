import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "OHS openhouse — FIND · JOIN · PLAY";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #18181b 0%, #27272a 55%, #1c1917 100%)",
          color: "#fafafa",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 20,
            marginBottom: 28,
          }}
        >
          <span
            style={{
              fontSize: 128,
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1,
            }}
          >
            OHS
          </span>
          <span
            style={{
              fontSize: 44,
              fontWeight: 500,
              color: "#a1a1aa",
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}
          >
            openhouse
          </span>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 36,
            fontWeight: 600,
            letterSpacing: "0.28em",
            color: "#34d399",
            textTransform: "uppercase",
          }}
        >
          FIND · JOIN · PLAY
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 6,
            background: "linear-gradient(90deg, #34d399 0%, #10b981 50%, #059669 100%)",
          }}
        />
      </div>
    ),
    {
      ...size,
    },
  );
}
