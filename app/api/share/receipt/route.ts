import { NextResponse } from "next/server";
import {
  buildVerifiedAuditReceiptPayload,
  createShareReceiptToken,
  isShareReceiptConfigured,
  ShareReceiptError,
} from "@/lib/shareReceipt";
import { parseRepository, scoreRepo, ScoreRepoError } from "@/lib/scoreRepo";
import {
  isShareableCheckLabel,
  type ShareableCheckLabel,
} from "@/lib/shareTypes";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

const noStore = {
  headers: {
    "Cache-Control": "no-store, max-age=0",
  },
};

export async function POST(request: Request) {
  if (!isShareReceiptConfigured()) {
    return NextResponse.json(
      { error: "receipt-unavailable" },
      { status: 503, ...noStore },
    );
  }

  const body = await readRequestBody(request);
  const parsedRepository = parseRepository(body.repo);
  if (!parsedRepository) {
    return NextResponse.json({ error: "invalid-format" }, { status: 400, ...noStore });
  }

  try {
    // Never sign a browser-provided score. The explicit user action below always
    // recomputes the public audit on the server with the existing fresh-read rules.
    const result = await scoreRepo(parsedRepository.owner, parsedRepository.repo, {
      fresh: true,
    });
    const payload = buildVerifiedAuditReceiptPayload(result, body.selectedLabels);
    const token = await createShareReceiptToken(payload);

    return NextResponse.json(
      {
        token,
        url: absoluteUrl(`/share/receipt/${token}`),
        payload,
      },
      noStore,
    );
  } catch (error) {
    if (error instanceof ScoreRepoError) {
      return NextResponse.json(
        { error: error.code },
        { status: error.status, ...noStore },
      );
    }

    if (error instanceof ShareReceiptError) {
      return NextResponse.json(
        { error: error.code },
        { status: 503, ...noStore },
      );
    }

    return NextResponse.json({ error: "upstream-error" }, { status: 502, ...noStore });
  }
}

async function readRequestBody(request: Request): Promise<{
  repo: string;
  selectedLabels: ShareableCheckLabel[];
}> {
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) {
      return { repo: "", selectedLabels: [] };
    }

    const selectedLabels = Array.isArray(body.selectedLabels)
      ? body.selectedLabels.filter(isShareableCheckLabel).slice(0, 6)
      : [];

    return {
      repo: typeof body.repo === "string" ? body.repo : "",
      selectedLabels,
    };
  } catch {
    return { repo: "", selectedLabels: [] };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
