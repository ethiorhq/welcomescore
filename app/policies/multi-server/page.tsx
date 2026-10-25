import type { Metadata } from "next";
import Link from "next/link";
import PolicyPage, { PolicyCallout, PolicyTable, type PolicySection } from "@/app/components/PolicyPage";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "WelcomeScore Multi-Server High Availability Policy: Dual-Cloud Active-Active Architecture",
  description: "Enterprise multi-cloud architecture, active-active failover, 99.99% uptime SLA, and real-time synchronization between Cloudflare Edge and Vercel Mirror.",
  path: "/policies/multi-server",
  imagePath: "/opengraph-image",
  imageAlt: "WelcomeScore Multi-Server High Availability Policy",
});

const sections: PolicySection[] = [
  {
    id: "architecture-overview",
    title: "Dual-Cloud Active-Active Architecture",
    content: (
      <>
        <p>
          WelcomeScore is engineered with an active-active, dual-cloud infrastructure to eliminate single points of failure and deliver low latency across the globe. Rather than relying on a single cloud vendor, WelcomeScore operates simultaneously across two premier edge compute networks:
        </p>
        <PolicyTable>
          <thead className="border-b border-muted/25 font-mono text-xs uppercase tracking-[0.12em] text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Tier</th>
              <th className="px-4 py-3 font-semibold">Cloud Infrastructure</th>
              <th className="px-4 py-3 font-semibold">Runtime & Topology</th>
              <th className="px-4 py-3 font-semibold">Canonical Endpoint</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-muted/15 text-muted">
            <tr>
              <td className="px-4 py-3 font-mono text-text">Primary Edge</td>
              <td className="px-4 py-3">Cloudflare Workers & Pages via OpenNext</td>
              <td className="px-4 py-3">Workerd V8 Isolates across 275+ global cities with sub-10ms TTFB and 0ms cold starts</td>
              <td className="px-4 py-3 font-mono text-accent">welcomescore.is-local.org</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-mono text-text">Failover Mirror</td>
              <td className="px-4 py-3">Vercel Edge Network & Serverless Mirror</td>
              <td className="px-4 py-3">Node.js / Edge hybrid compute with instant edge caching and automated fallback</td>
              <td className="px-4 py-3 font-mono text-accent">welcomescore.vercel.app</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-mono text-text">Unified Persistence</td>
              <td className="px-4 py-3">Supabase PostgreSQL Enterprise Cluster</td>
              <td className="px-4 py-3">Row Level Security (RLS), real-time replication, SSL-enforced connection pooling</td>
              <td className="px-4 py-3 font-mono text-accent">gznnbppmxqrjmyntaria.supabase.co</td>
            </tr>
          </tbody>
        </PolicyTable>
      </>
    ),
  },
  {
    id: "uptime-commitment",
    title: "99.99% Availability Commitment & Zero-Downtime Deployments",
    content: (
      <>
        <p>
          WelcomeScore commits to a <strong>99.99% service availability target</strong> for all public audits, contributor badges, Dev Lounge conversations, and developer guides. Because both Cloudflare and Vercel environments are fully synchronized and continuously updated via branch-level CI/CD pipelines, routine deployments or maintenance events require zero scheduled downtime.
        </p>
        <PolicyCallout>
          In the event of an upstream outage, routing degradation, or regional transit disruption affecting one provider, visitors can instantaneously switch to the alternate edge mirror via the top-bar Server Switcher with full session and route preservation.
        </PolicyCallout>
      </>
    ),
  },
  {
    id: "data-synchronization",
    title: "Real-Time State & Data Parity",
    content: (
      <>
        <p>
          Both edge environments communicate with the same persistent PostgreSQL data layer hosted on Supabase:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-muted">
          <li>
            <strong>Dev Lounge Chat:</strong> Messages, reactions, and contributor questions posted on Cloudflare Edge appear in real time on Vercel Mirror, and vice versa.
          </li>
          <li>
            <strong>Subscriber Lists:</strong> Email subscriptions are deduplicated and saved to the central subscriber store regardless of which server processed the submission.
          </li>
          <li>
            <strong>Hall of Fame:</strong> Audited repository records, contributor health badges, and community scores are shared globally without drift.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "server-switching",
    title: "Live Server Detection and Client Failover",
    content: (
      <>
        <p>
          Every page header contains a compact, non-intrusive <strong>Server Switcher</strong> positioned directly underneath the GitHub Star badge. The switcher automatically detects the current serving network via edge request headers:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-muted">
          <li>
            Displays a live green beacon when running on <strong>Cloudflare Edge</strong>, with a one-click link to failover to Vercel.
          </li>
          <li>
            Displays a live amber beacon when running on <strong>Vercel Mirror</strong>, with a one-click link to switch back to Cloudflare.
          </li>
          <li>
            Preserves the visitor’s exact route path, URL query parameters, and audit context across transitions.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "health-monitoring",
    title: "Continuous Health Verification & API Heartbeat",
    content: (
      <>
        <p>
          The multi-server network provides an automated, edge-native health check endpoint:
        </p>
        <p className="font-mono text-xs text-accent">
          GET <Link href="/api/health" className="underline underline-offset-4">/api/health</Link> &amp; <Link href="/api/server-status" className="underline underline-offset-4">/api/server-status</Link>
        </p>
        <p>
          This endpoint reports live edge runtime metadata, database connectivity status, upstream latency in milliseconds, and the current mirror endpoint. Automated uptime monitors continuously ping both providers to verify operational readiness ahead of public launches.
        </p>
      </>
    ),
  },
];

export default function MultiServerPolicyPage() {
  return (
    <PolicyPage
      eyebrow="High-availability infrastructure"
      title="Multi-Server Reliability & Active-Active Architecture Policy"
      description="How WelcomeScore guarantees high availability, sub-10ms response times, and uninterrupted contributor audits across Cloudflare Global Edge and Vercel Serverless Mirror."
      effectiveDate="October 26, 2026"
      sections={sections}
    />
  );
}
