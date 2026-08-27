import type { Metadata } from "next";
import Link from "next/link";
import {
  SHARE_RECEIPT_EXPIRED,
  SHARE_RECEIPT_UNAVAILABLE,
  ShareReceiptError,
  verifyShareReceiptToken,
} from "@/lib/shareReceipt";
import { formatReceiptDate } from "@/lib/shareTypes";
import { absoluteUrl, SITE_DISPLAY_NAME } from "@/lib/site";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ReceiptPageProps = {
  params: { token: string };
};

export async function generateMetadata({ params }: ReceiptPageProps): Promise<Metadata> {
  const receipt = await getReceipt(params.token);
  const title = receipt
    ? `${receipt.repo} contributor context | ${SITE_DISPLAY_NAME}`
    : `Audit receipt unavailable | ${SITE_DISPLAY_NAME}`;
  const description = receipt
    ? `Dated public contributor-readiness audit context for ${receipt.repo}. This is not a certification or endorsement.`
    : "This dated public audit receipt is unavailable.";

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: receipt
      ? {
          title,
          description,
          images: [absoluteUrl(`/share/receipt/${params.token}/opengraph-image`)],
        }
      : undefined,
  };
}

export default async function ReceiptPage({ params }: ReceiptPageProps) {
  const receipt = await getReceipt(params.token);
  if (!receipt) {
    return <UnavailableReceipt token={params.token} />;
  }

  const [owner, repo] = receipt.repo.split("/");
  const auditPath = `/check/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;

  return (
    <main className="mx-auto flex min-h-[calc(100vh-13rem)] w-full max-w-3xl flex-col px-4 py-12 sm:px-6 sm:py-16">
      <section className="w-full rounded-lg border border-muted/25 bg-surface p-5 sm:p-8">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
          Verified contributor context
        </p>
        <h1 className="mt-3 break-all font-mono text-2xl font-bold text-text sm:text-3xl">
          {receipt.repo}
        </h1>
        <p className="mt-3 font-sans text-sm leading-6 text-muted">
          Observed public contributor signals on {formatReceiptDate(receipt.issuedAt)}. This snapshot expires on {formatReceiptDate(receipt.expiresAt)}.
        </p>

        <div className="mt-7 rounded-md border border-muted/25 bg-base/35 p-4 sm:p-5">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted">Observed snapshot</p>
          <div className="mt-3 flex items-end gap-3">
            <span className="font-mono text-5xl font-bold leading-none text-text sm:text-6xl">{receipt.score}</span>
            <span className="pb-0.5 font-mono text-2xl font-bold text-accent sm:text-3xl">{receipt.grade}</span>
            <span className="pb-1 font-mono text-sm text-muted">/ 100</span>
          </div>
        </div>

        <section className="mt-7" aria-labelledby="receipt-signals-title">
          <h2 id="receipt-signals-title" className="font-sans text-sm font-semibold text-text">
            Included public signals
          </h2>
          {receipt.passedCheckLabels.length > 0 || receipt.goodFirstIssueCount > 0 ? (
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {receipt.passedCheckLabels.map((label) => (
                <li key={label} className="rounded-md border border-muted/25 bg-base/25 px-3 py-2 font-sans text-sm text-text">
                  <span aria-hidden="true" className="mr-2 text-good">✓</span>
                  {label}
                </li>
              ))}
              {receipt.goodFirstIssueCount > 0 ? (
                <li className="rounded-md border border-muted/25 bg-base/25 px-3 py-2 font-sans text-sm text-text">
                  <span aria-hidden="true" className="mr-2 text-good">•</span>
                  {receipt.goodFirstIssueCount} open good-first issue{receipt.goodFirstIssueCount === 1 ? "" : "s"}
                </li>
              ) : null}
            </ul>
          ) : (
            <p className="mt-3 font-sans text-sm leading-6 text-muted">
              No optional check detail was included in this receipt. The dated score and grade above remain the signed public snapshot.
            </p>
          )}
        </section>

        <div className="mt-7 border-t border-muted/20 pt-5">
          <p className="font-sans text-sm leading-6 text-muted">
            This is a dated public contributor-readiness snapshot, not a quality, security, legal, or community-endorsement certification. It does not establish Hall membership or guarantee current repository state.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={auditPath}
              className="inline-flex h-10 items-center justify-center rounded-md border border-accent/45 bg-accent/10 px-4 font-sans text-sm font-medium text-accent transition-colors duration-180 ease-out hover:bg-accent/15"
            >
              Run a current audit for {receipt.repo}
            </Link>
            <a
              href={`https://github.com/${receipt.repo}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center justify-center rounded-md border border-muted/35 bg-base/30 px-4 font-sans text-sm font-medium text-muted transition-colors duration-180 ease-out hover:border-accent/45 hover:text-accent"
            >
              Open repository on GitHub ↗
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

async function getReceipt(token: string) {
  try {
    return await verifyShareReceiptToken(token);
  } catch {
    return null;
  }
}

async function UnavailableReceipt({ token }: { token: string }) {
  const state = await getReceiptState(token);
  const message =
    state === SHARE_RECEIPT_EXPIRED
      ? "This dated audit receipt has expired. Run a current audit to review fresh public contributor signals."
      : state === SHARE_RECEIPT_UNAVAILABLE
        ? "This audit receipt cannot be verified right now. No receipt data is shown."
        : "This audit receipt is unavailable. It may be invalid or no longer available.";

  return (
    <main className="mx-auto flex min-h-[calc(100vh-13rem)] w-full max-w-3xl flex-col px-4 py-12 sm:px-6 sm:py-16">
      <section className="w-full rounded-lg border border-muted/25 bg-surface p-5 sm:p-8">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">Audit receipt</p>
        <h1 className="mt-3 font-mono text-2xl font-bold text-text">Receipt unavailable</h1>
        <p className="mt-3 max-w-xl font-sans text-sm leading-6 text-muted">{message}</p>
        <Link
          href="/"
          className="mt-6 inline-flex h-10 w-fit items-center justify-center rounded-md border border-accent/45 bg-accent/10 px-4 font-sans text-sm font-medium text-accent transition-colors duration-180 ease-out hover:bg-accent/15"
        >
          Check a public repository
        </Link>
      </section>
    </main>
  );
}

async function getReceiptState(token: string) {
  try {
    await verifyShareReceiptToken(token);
    return "invalid-receipt";
  } catch (error) {
    return error instanceof ShareReceiptError ? error.code : "invalid-receipt";
  }
}
