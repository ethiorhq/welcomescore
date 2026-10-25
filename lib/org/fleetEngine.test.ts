import { describe, it, expect } from "vitest";
import { estimateRepoScore, aggregateOrgFleet } from "./fleetEngine";

describe("fleetEngine", () => {
  it("estimates repository baseline health based on public signals", () => {
    const activeRepo = estimateRepoScore({
      name: "welcomescore",
      full_name: "ethiorhq/welcomescore",
      description: "Fast contributor readiness scoring tool",
      stargazers_count: 120,
      forks_count: 15,
      pushed_at: new Date().toISOString(),
      license: { spdx_id: "MIT" },
    });

    expect(activeRepo.score).toBeGreaterThanOrEqual(85);
    expect(activeRepo.isStale).toBe(false);
    expect(activeRepo.missingFiles.length).toBe(0);

    const staleUnlicensedRepo = estimateRepoScore({
      name: "abandoned-demo",
      full_name: "user/abandoned-demo",
      description: null,
      stargazers_count: 0,
      forks_count: 0,
      pushed_at: "2020-01-01T00:00:00Z",
      license: null,
    });

    expect(staleUnlicensedRepo.score).toBeLessThanOrEqual(40);
    expect(staleUnlicensedRepo.isStale).toBe(true);
    expect(staleUnlicensedRepo.missingFiles).toContain("LICENSE");
  });

  it("aggregates fleet statistics across multiple org repositories", () => {
    const rawRepos = [
      {
        name: "repo-1",
        full_name: "testorg/repo-1",
        description: "Flagship repo with full docs",
        stargazers_count: 500,
        forks_count: 50,
        pushed_at: new Date().toISOString(),
        license: { spdx_id: "Apache-2.0" },
      },
      {
        name: "repo-2",
        full_name: "testorg/repo-2",
        description: "Small helper library",
        stargazers_count: 10,
        forks_count: 2,
        pushed_at: new Date().toISOString(),
        license: { spdx_id: "MIT" },
      },
      {
        name: "repo-3",
        full_name: "testorg/repo-3",
        description: null,
        stargazers_count: 1,
        forks_count: 0,
        pushed_at: "2021-01-01T00:00:00Z",
        license: null,
      },
    ];

    const fleet = aggregateOrgFleet("testorg", rawRepos);

    expect(fleet.totalRepos).toBe(3);
    expect(fleet.totalStars).toBe(511);
    expect(fleet.totalForks).toBe(52);
    expect(fleet.staleRepoCount).toBe(1);
    expect(fleet.topPerformers.length).toBe(3);
    expect(fleet.topPerformers[0].name).toBe("repo-1");
    expect(fleet.criticalAttentionRequired.some((r) => r.name === "repo-3")).toBe(true);
  });

  it("handles empty organization repos gracefully", () => {
    const emptyFleet = aggregateOrgFleet("ghost-org", []);
    expect(emptyFleet.totalRepos).toBe(0);
    expect(emptyFleet.fleetAverageScore).toBe(0);
    expect(emptyFleet.fleetGrade).toBe("F");
  });
});
