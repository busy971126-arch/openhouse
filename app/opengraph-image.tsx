import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "OHS openhouse — FIND · JOIN · PLAY";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function OpenGraphImage() {
  const wordmark = await fetch(
    new URL("../public/images/ohs-wordmark.png", import.meta.url),
  ).then((response) => response.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "#e8e8e8",
          color: "#111111",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 20,
            marginBottom: 36,
          }}
        >
          <div
            style={{
              display: "flex",
              height: 200,
              overflow: "hidden",
            }}
          >
            <img
              alt=""
              src={wordmark as unknown as string}
              width={520}
              height={520}
              style={{
                objectFit: "contain",
                objectPosition: "top center",
              }}
            />
          </div>
          <span
            style={{
              fontSize: 42,
              fontWeight: 500,
              color: "#737373",
              letterSpacing: "-0.02em",
              lineHeight: 1,
              marginBottom: 18,
            }}
          >
            openhouse
          </span>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 34,
            fontWeight: 700,
            fontStyle: "italic",
            letterSpacing: "0.22em",
            color: "#111111",
            textTransform: "uppercase",
          }}
        >
          FIND · JOIN · PLAY
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
