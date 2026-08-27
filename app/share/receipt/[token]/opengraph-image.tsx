import { ImageResponse } from "next/og";
import { verifyShareReceiptToken } from "@/lib/shareReceipt";
import { formatReceiptDate } from "@/lib/shareTypes";

export const runtime = "edge";
export const alt = "WelcomeScore dated contributor-readiness audit context";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

type ReceiptImageProps = {
  params: { token: string };
};

export default async function ReceiptOpenGraphImage({ params }: ReceiptImageProps) {
  try {
    const receipt = await verifyShareReceiptToken(params.token);

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
              background: "radial-gradient(circle, rgba(232, 162, 61, 0.28) 0%, rgba(232, 162, 61, 0.06) 42%, rgba(18, 20, 28, 0) 72%)",
              borderRadius: 9999,
              height: 600,
              left: 560,
              position: "absolute",
              top: 85,
              width: 600,
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

          <div style={{ display: "flex", flexDirection: "column", zIndex: 1 }}>
            <div style={{ color: "#8B8F9E", display: "flex", fontFamily: "monospace", fontSize: 20, letterSpacing: 1.2, textTransform: "uppercase" }}>
              Dated contributor context
            </div>
            <div style={{ color: "#F2EEE6", display: "flex", fontFamily: "monospace", fontSize: 38, fontWeight: 700, marginTop: 20 }}>
              {receipt.repo}
            </div>
            <div style={{ alignItems: "flex-end", display: "flex", gap: 20, marginTop: 26 }}>
              <div style={{ color: "#F2EEE6", display: "flex", fontFamily: "monospace", fontSize: 110, fontWeight: 700, letterSpacing: -6, lineHeight: 1 }}>
                {receipt.score}
              </div>
              <div style={{ color: "#E8A23D", display: "flex", fontFamily: "monospace", fontSize: 54, fontWeight: 700, marginBottom: 8 }}>
                {receipt.grade} / 100
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", zIndex: 1 }}>
            <div style={{ color: "#C6C8D2", display: "flex", fontFamily: "sans-serif", fontSize: 24 }}>
              Public snapshot issued {formatReceiptDate(receipt.issuedAt)} · expires {formatReceiptDate(receipt.expiresAt)}
            </div>
            <div style={{ color: "#8B8F9E", display: "flex", fontFamily: "sans-serif", fontSize: 18, marginTop: 11 }}>
              Contributor-readiness context, not a quality, security, or community-endorsement certification.
            </div>
          </div>
        </div>
      ),
      size,
    );
  } catch {
    return new ImageResponse(
      (
        <div
          style={{
            alignItems: "center",
            background: "#12141C",
            color: "#8B8F9E",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            justifyContent: "center",
            padding: "58px 64px",
            width: "100%",
          }}
        >
          <div style={{ color: "#E8A23D", display: "flex", fontFamily: "monospace", fontSize: 34, fontWeight: 700 }}>
            WelcomeScore.js.org
          </div>
          <div style={{ display: "flex", fontFamily: "sans-serif", fontSize: 30, marginTop: 22 }}>
            This dated audit receipt is unavailable.
          </div>
        </div>
      ),
      size,
    );
  }
}
