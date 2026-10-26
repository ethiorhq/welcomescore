import { NextResponse } from "next/server";
import { diagnoseDevOps, type WorkflowFileSample } from "@/lib/devops/doctor";
import { parseRepository } from "@/lib/scoreRepo";

export const dynamic = "force-dynamic";

const GITHUB_API = "https://api.github.com";

function githubFetch(url: string, fresh = false) {
  const headers = new Headers({
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "WelcomeScore-DevOpsDoctor/1.0",
  });

  if (process.env.GITHUB_TOKEN) {
    headers.set("Authorization", `Bearer ${process.env.GITHUB_TOKEN}`);
  }

  return fetch(url, {
    headers,
    cache: fresh ? "no-store" : "default",
    next: fresh ? undefined : { revalidate: 300 },
  });
}

function decodeBase64(value: string) {
  try {
    const binary = atob(value);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return "";
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const repoQuery = searchParams.get("repo");
  const fresh = searchParams.get("fresh") === "true";

  if (!repoQuery) {
    return NextResponse.json(
      { ok: false, error: "Missing 'repo' query parameter" },
      { status: 400 },
    );
  }

  const parsed = parseRepository(repoQuery);
  if (!parsed) {
    return NextResponse.json(
      { ok: false, error: "Invalid repository format. Use 'owner/repo' or GitHub URL." },
      { status: 400 },
    );
  }

  const { owner, repo } = parsed;
  const fullName = `${owner}/${repo}`;

  try {
    // 1. Fetch Repo info (default branch & license)
    const repoRes = await githubFetch(`${GITHUB_API}/repos/${owner}/${repo}`, fresh);

    if (repoRes.status === 404) {
      return NextResponse.json(
        { ok: false, error: "Repository not found or private on GitHub" },
        { status: 404 },
      );
    }

    if (repoRes.status === 403 || repoRes.status === 429) {
      // Deterministic fallback report when rate limited
      const fallbackReport = diagnoseDevOps({
        repo: fullName,
        defaultBranch: "main",
        licenseSpdx: "MIT",
        workflowFiles: [],
      });

      return NextResponse.json({
        ok: true,
        repo: fullName,
        cached: true,
        rateLimited: true,
        report: fallbackReport,
      });
    }

    const repoData = (await repoRes.json()) as {
      default_branch?: string;
      license?: { spdx_id?: string } | null;
      language?: string | null;
      private?: boolean;
      visibility?: string;
    };

    // STRICT PRIVACY FIREWALL: Private repos must return 404 Not Found
    if (repoData.private || (repoData.visibility && repoData.visibility !== "public")) {
      return NextResponse.json(
        { ok: false, error: "Repository not found or is private on GitHub" },
        { status: 404 },
      );
    }

    const defaultBranch = repoData.default_branch || "main";
    const licenseSpdx = repoData.license?.spdx_id || null;

    // 2. Fetch .github/workflows directory listing
    const wfRes = await githubFetch(
      `${GITHUB_API}/repos/${owner}/${repo}/contents/.github/workflows?ref=${encodeURIComponent(
        defaultBranch,
      )}`,
      fresh,
    );

    const workflowFiles: WorkflowFileSample[] = [];

    if (wfRes.ok) {
      const items = (await wfRes.json()) as Array<{
        name: string;
        path: string;
        type: string;
        download_url?: string;
      }>;

      const ymlFiles = Array.isArray(items)
        ? items
            .filter((item) => item.type === "file" && (item.name.endsWith(".yml") || item.name.endsWith(".yaml")))
            .slice(0, 4)
        : [];

      for (const file of ymlFiles) {
        try {
          const fileRes = await githubFetch(
            `${GITHUB_API}/repos/${owner}/${repo}/contents/${file.path}?ref=${encodeURIComponent(
              defaultBranch,
            )}`,
            fresh,
          );
          if (fileRes.ok) {
            const fileData = (await fileRes.json()) as { content?: string; encoding?: string };
            if (fileData.content && fileData.encoding === "base64") {
              const decoded = decodeBase64(fileData.content.replace(/\s/g, ""));
              workflowFiles.push({
                path: file.path,
                content: decoded,
              });
            }
          }
        } catch {
          // Continue to next workflow file
        }
      }
    }

    // 3. Run DevOps diagnosis
    const report = diagnoseDevOps({
      repo: fullName,
      defaultBranch,
      licenseSpdx,
      workflowFiles,
    });

    return NextResponse.json(
      {
        ok: true,
        repo: fullName,
        defaultBranch,
        workflowCount: workflowFiles.length,
        report,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Internal diagnosis failure",
      },
      { status: 500 },
    );
  }
}
