import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

const boldFont = fetch(
  "https://fonts.gstatic.com/s/ibmplexmono/v20/-F6qfjptAgt5VM-kVkqdyU8n3pQP8lc.ttf",
).then((response) => response.arrayBuffer());

export default async function AppleIcon() {
  const font = await boldFont;

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
          fontSize: 130,
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        W
      </div>
    ),
    {
      ...size,
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
