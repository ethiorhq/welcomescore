import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "WelcomeScore — contributor readiness for public GitHub repositories";
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
          alignItems: "stretch",
          background: "#12141C",
          color: "#F2EEE6",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "space-between",
          overflow: "hidden",
          padding: "58px 64px",
          position: "relative",
          width: "100%",
        }}
      >
        <div
          style={{
            background: "radial-gradient(circle, rgba(232, 162, 61, 0.30) 0%, rgba(232, 162, 61, 0.07) 42%, rgba(18, 20, 28, 0) 72%)",
            borderRadius: 9999,
            height: 620,
            left: 560,
            position: "absolute",
            top: 110,
            width: 620,
          }}
        />
        <div style={{ alignItems: "center", display: "flex", gap: 16, zIndex: 1 }}>
          <div style={{ color: "#E8A23D", display: "flex", fontFamily: "monospace", fontSize: 30, fontWeight: 700, letterSpacing: -1 }}>
            WelcomeScore
          </div>
          <div
            style={{
              background: "rgba(232, 162, 61, 0.10)",
              border: "1px solid rgba(232, 162, 61, 0.40)",
              borderRadius: 8,
              color: "#E8A23D",
              display: "flex",
              fontFamily: "monospace",
              fontSize: 17,
              fontWeight: 700,
              padding: "7px 10px",
            }}
          >
            .js.org
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", maxWidth: 930, zIndex: 1 }}>
          <div style={{ color: "#8B8F9E", display: "flex", fontFamily: "monospace", fontSize: 19, letterSpacing: 1.2, textTransform: "uppercase" }}>
            Contributor readiness, made visible
          </div>
          <div style={{ color: "#F2EEE6", display: "flex", fontFamily: "sans-serif", fontSize: 68, fontWeight: 700, letterSpacing: -3, lineHeight: 1.06, marginTop: 18 }}>
            Make the first contribution easier to start.
          </div>
          <div style={{ color: "#C6C8D2", display: "flex", fontFamily: "sans-serif", fontSize: 28, lineHeight: 1.35, marginTop: 24 }}>
            Audit public GitHub contributor signals and get practical next steps for your repository.
          </div>
        </div>

        <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between", zIndex: 1 }}>
          <div style={{ color: "#8B8F9E", display: "flex", fontFamily: "monospace", fontSize: 20 }}>
            welcomescore.vercel.app
          </div>
          <div
            style={{
              background: "#E8A23D",
              borderRadius: 10,
              color: "#12141C",
              display: "flex",
              fontFamily: "monospace",
              fontSize: 20,
              fontWeight: 700,
              padding: "13px 18px",
            }}
          >
            Check a repository
          </div>
        </div>
      </div>
    ),
    size,
  );
}
