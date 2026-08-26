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
          <svg
            width="600"
            height="315"
            viewBox="0 0 600 315"
            fill="none"
            style={{
              position: "absolute",
              inset: 0,
            }}
          >
            <defs>
              <radialGradient id="score-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#E8A23D" stopOpacity="0.32" />
                <stop offset="38%" stopColor="#E8A23D" stopOpacity="0.16" />
                <stop offset="72%" stopColor="#E8A23D" stopOpacity="0.035" />
                <stop offset="100%" stopColor="#E8A23D" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="300" cy="158" r="166" fill="url(#score-glow)" />
          </svg>

          <div
            style={{
              position: "absolute",
              top: 26,
              left: 32,
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              fontFamily: "IBM Plex Mono",
            }}
          >
            <span
              style={{
                display: "flex",
                color: "#E8A23D",
                fontSize: 28,
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              WelcomeScore
            </span>
            <span
              style={{
                display: "flex",
                marginTop: 1,
                padding: "4px 7px",
                border: "1px solid rgba(232, 162, 61, 0.3)",
                borderRadius: 6,
                backgroundColor: "rgba(232, 162, 61, 0.1)",
                color: "#E8A23D",
                fontSize: 11,
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              .js.org
            </span>
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
