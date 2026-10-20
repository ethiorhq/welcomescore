import { describe, expect, it } from "vitest";
import {
  DEFAULT_GITHUB_REPO_NAME,
  DEFAULT_GITHUB_REPO_OWNER,
  GITHUB_REPO_URL,
  getGitHubRepoUrl,
  getShieldsStarBadgeUrl,
} from "./githubBadge";

describe("GitHub Star Badge Helpers", () => {
  it("uses ethiorhq/welcomescore as default repository", () => {
    expect(DEFAULT_GITHUB_REPO_OWNER).toBe("ethiorhq");
    expect(DEFAULT_GITHUB_REPO_NAME).toBe("welcomescore");
    expect(GITHUB_REPO_URL).toBe("https://github.com/ethiorhq/welcomescore");
  });

  it("constructs repository URL correctly", () => {
    expect(getGitHubRepoUrl()).toBe("https://github.com/ethiorhq/welcomescore");
    expect(getGitHubRepoUrl("vercel", "next.js")).toBe("https://github.com/vercel/next.js");
  });

  it("constructs Shields.io star badge URL correctly", () => {
    expect(getShieldsStarBadgeUrl()).toBe(
      "https://img.shields.io/github/stars/ethiorhq/welcomescore?style=social",
    );
    expect(getShieldsStarBadgeUrl("facebook", "react")).toBe(
      "https://img.shields.io/github/stars/facebook/react?style=social",
    );
  });
});
