import Link from "next/link";
import BackButton from "@/app/components/BackButton";
import HeaderControls from "@/app/components/HeaderControls";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-4xl flex-col justify-center px-4 py-12 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <BackButton />
        <HeaderControls />
      </div>

      <div className="rounded-lg border border-border bg-surface p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted">PAGE STATUS</span>
          <span className="rounded border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[11px] font-medium text-amber-400">
            404 Not Found
          </span>
        </div>

        <h1 className="mt-2 font-mono text-xl font-bold text-text sm:text-2xl">
          Repository or Resource Not Found
        </h1>

        <p className="mt-3 text-sm text-muted">
          The requested repository, audit report, or page does not exist or may be private. WelcomeScore audits public open-source GitHub repositories.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-md bg-accent px-4 py-2 font-mono text-xs font-semibold text-base transition hover:bg-accent/90"
          >
            Audit a Repository
          </Link>
          <Link
            href="/devops"
            className="rounded-md border border-border bg-base px-4 py-2 font-mono text-xs text-muted transition hover:border-accent/40 hover:text-text"
          >
            DevOps Doctor
          </Link>
          <Link
            href="/org"
            className="rounded-md border border-border bg-base px-4 py-2 font-mono text-xs text-muted transition hover:border-accent/40 hover:text-text"
          >
            Organization Fleet
          </Link>
          <Link
            href="/templates"
            className="rounded-md border border-border bg-base px-4 py-2 font-mono text-xs text-muted transition hover:border-accent/40 hover:text-text"
          >
            Template Studio
          </Link>
        </div>
      </div>
    </div>
  );
}
