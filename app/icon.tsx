import { ImageResponse } from "next/og";

export const runtime = "edge";
export const contentType = "image/png";

const boldFont = fetch(
  "https://fonts.gstatic.com/s/ibmplexmono/v20/-F6qfjptAgt5VM-kVkqdyU8n3pQP8lc.ttf",
).then((response) => response.arrayBuffer());

export function generateImageMetadata() {
  return [
    {
      id: "small",
      size: { width: 32, height: 32 },
    },
    {
      id: "medium",
      size: { width: 192, height: 192 },
    },
    {
      id: "large",
      size: { width: 512, height: 512 },
    },
    {
      id: "maskable",
      size: { width: 512, height: 512 },
    },
  ];
}

export default async function Icon({ id }: { id: string }) {
  const font = await boldFont;
  const fontSize = id === "small" ? 24 : id === "medium" ? 140 : 380;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#12141C",
          color: "#E8A23D",
          fontFamily: "IBM Plex Mono",
          fontSize: fontSize,
          fontWeight: 700,
          lineHeight: 1,
          padding: id === "maskable" ? "10%" : "0",
        }}
      >
        W
      </div>
    ),
    {
      width: id === "small" ? 32 : id === "medium" ? 192 : 512,
      height: id === "small" ? 32 : id === "medium" ? 192 : 512,
      fonts: [
        {
          name: "IBM Plex Mono",
          data: font,
          weight: 700 as const,
          style: "normal" as const,
        },
      ],
    },
  );
}
