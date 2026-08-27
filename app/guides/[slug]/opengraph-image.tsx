import { ImageResponse } from "next/og";
import { guideBySlug } from "@/lib/guides";

export const runtime = "edge";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

type ImageProps = {
  params: {
    slug: string;
  };
};

export default function GuideOpenGraphImage({ params }: ImageProps) {
  const guide = guideBySlug(params.slug);
  const title = guide?.title ?? "Developer guides for contributor-ready repositories";
  const category = guide?.category ?? "WelcomeScore guide";

  return new ImageResponse(
    (
      <div
        style={{
          background: "#12141C",
          color: "#F2EEE6",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "space-between",
          overflow: "hidden",
          padding: "56px 64px",
          position: "relative",
          width: "100%",
        }}
      >
        <div
          style={{
            background: "radial-gradient(circle, rgba(232, 162, 61, 0.24) 0%, rgba(232, 162, 61, 0.04) 45%, rgba(18, 20, 28, 0) 72%)",
            borderRadius: 9999,
            height: 670,
            position: "absolute",
            right: -120,
            top: -130,
            width: 670,
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
          <div style={{ color: "#E8A23D", display: "flex", fontFamily: "monospace", fontSize: 20, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
            {category}
          </div>
          <div style={{ color: "#F2EEE6", display: "flex", fontFamily: "sans-serif", fontSize: 62, fontWeight: 700, letterSpacing: -2.5, lineHeight: 1.08, marginTop: 20 }}>
            {title}
          </div>
        </div>

        <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between", zIndex: 1 }}>
          <div style={{ color: "#8B8F9E", display: "flex", fontFamily: "monospace", fontSize: 20 }}>
            Developer guides by ETHIOR
          </div>
          <div style={{ color: "#E8A23D", display: "flex", fontFamily: "monospace", fontSize: 20, fontWeight: 700 }}>
            Read the guide →
          </div>
        </div>
      </div>
    ),
    size,
  );
}
