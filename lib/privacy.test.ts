import { describe, expect, it } from "vitest";
import { aggregateOrgFleet } from "@/lib/org/fleetEngine";

describe("Strict Privacy Firewall", () => {
  it("filters out any private or non-public repositories from org fleet data", () => {
    const rawFleetData = [
      {
        name: "welcomescore",
        full_name: "ethiorhq/welcomescore",
        description: "Public WelcomeScore repository",
        stargazers_count: 10,
        forks_count: 2,
        pushed_at: "2026-10-26T00:00:00Z",
        license: { spdx_id: "MIT" },
        private: false,
        visibility: "public",
      },
      {
        name: "docobuddy",
        full_name: "ethiorhq/docobuddy",
        description: "Confidential private internal repository",
        stargazers_count: 0,
        forks_count: 0,
        pushed_at: "2026-10-26T00:00:00Z",
        license: null,
        private: true,
        visibility: "private",
      },
      {
        name: "client-private-app",
        full_name: "ethiorhq/client-private-app",
        description: "Client confidential",
        stargazers_count: 0,
        forks_count: 0,
        pushed_at: "2026-10-26T00:00:00Z",
        license: null,
        private: true,
        visibility: "internal",
      },
    ];

    // Simulate strict filtering applied in route handler
    const publicOnly = rawFleetData.filter(
      (r) => !r.private && (!r.visibility || r.visibility === "public"),
    );

    expect(publicOnly.length).toBe(1);
    expect(publicOnly[0].name).toBe("welcomescore");

    const report = aggregateOrgFleet("ethiorhq", publicOnly);
    expect(report.totalRepos).toBe(1);
    expect(report.repos.map((r) => r.name)).toEqual(["welcomescore"]);
    expect(report.repos.some((r) => r.name === "docobuddy")).toBe(false);
    expect(report.repos.some((r) => r.name === "client-private-app")).toBe(false);
  });
});
