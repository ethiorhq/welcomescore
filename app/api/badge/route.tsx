import { ImageResponse } from "next/og";
import { parseRepository, scoreRepo } from "@/lib/scoreRepo";

export const runtime = "edge";
export const revalidate = 300;

const regularFont = fetch(
  new URL("./IBMPlexMono-Regular.ttf", import.meta.url),
).then((response) => response.arrayBuffer());
const boldFont = fetch(
  new URL("./IBMPlexMono-Bold.ttf", import.meta.url),
).then((response) => response.arrayBuffer());

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsedRepository = parseRepository(searchParams.get("repo") ?? "");

  if (!parsedRepository) {
    return errorImage();
  }

  try {
    const result = await scoreRepo(parsedRepository.owner, parsedRepository.repo);
    const [regular, bold] = await Promise.all([regularFont, boldFont]);

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            position: "relative",
            overflow: "hidden",
            backgroundColor: "#1B1E29",
            color: "#F2EEE6",
            fontFamily: "IBM Plex Mono",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 330,
              height: 330,
              transform: "translate(-50%, -50%)",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(232, 162, 61, 0.34) 0%, rgba(232, 162, 61, 0) 68%)",
            }}
          />

          <div
            style={{
              position: "absolute",
              top: 30,
              left: 36,
              display: "flex",
              color: "#8B8F9E",
              fontSize: 22,
              fontWeight: 400,
            }}
          >
            WelcomeScore
          </div>

          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 22,
            }}
          >
            <span
              style={{
                display: "flex",
                color: "#E8A23D",
                fontSize: 128,
                lineHeight: 1,
                fontWeight: 700,
                letterSpacing: "-8px",
              }}
            >
              {result.score}
            </span>
            <span
              style={{
                display: "flex",
                color: "#E8A23D",
                fontSize: 76,
                lineHeight: 1,
                fontWeight: 700,
              }}
            >
              {result.grade}
            </span>
          </div>

          <div
            style={{
              position: "absolute",
              bottom: 30,
              left: 36,
              display: "flex",
              color: "#8B8F9E",
              fontSize: 22,
              fontWeight: 400,
            }}
          >
            {result.repo}
          </div>
        </div>
      ),
      imageOptions(regular, bold),
    );
  } catch {
    return errorImage();
  }
}

async function errorImage() {
  const regular = await regularFont;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1B1E29",
          color: "#8B8F9E",
          fontFamily: "IBM Plex Mono",
          fontSize: 34,
          fontWeight: 400,
        }}
      >
        Repo not found
      </div>
    ),
    imageOptions(regular),
  );
}

function imageOptions(regular: ArrayBuffer, bold?: ArrayBuffer) {
  return {
    width: 600,
    height: 315,
    fonts: [
      { name: "IBM Plex Mono", data: regular, weight: 400 as const, style: "normal" as const },
      ...(bold
        ? [{ name: "IBM Plex Mono", data: bold, weight: 700 as const, style: "normal" as const }]
        : []),
    ],
    headers: {
      "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=300",
    },
  };
}
