import { describe, it, expect } from "vitest";
import {
  normalizeBadgeStyle,
  createBadgeSvg,
  getRankConfig,
} from "./badgeEngine";

describe("badgeEngine", () => {
  it("normalizes standard and shields style keys", () => {
    expect(normalizeBadgeStyle("flat")).toBe("flat");
    expect(normalizeBadgeStyle("flat-square")).toBe("flat-square");
    expect(normalizeBadgeStyle("for-the-badge")).toBe("for-the-badge");
    expect(normalizeBadgeStyle("minimal")).toBe("1");
    expect(normalizeBadgeStyle("shield")).toBe("2");
    expect(normalizeBadgeStyle("unknown-style")).toBe("1");
  });

  it("produces valid SVG for flat and flat-square badges", () => {
    const flatSvg = createBadgeSvg(
      { repo: "welcomescore", score: 98, grade: "A+" },
      "flat",
    );
    expect(flatSvg).toContain("<svg");
    expect(flatSvg).toContain("98 A+");
    expect(flatSvg).toContain("welcomescore");
    expect(flatSvg).toContain('rx="3"');

    const squareSvg = createBadgeSvg(
      { repo: "welcomescore", score: 85, grade: "A" },
      "flat-square",
    );
    expect(squareSvg).toContain('rx="0"');
    expect(squareSvg).toContain("85 A");
  });

  it("produces valid uppercase SVG for for-the-badge", () => {
    const forTheBadgeSvg = createBadgeSvg(
      { repo: "welcomescore", score: 92, grade: "A", label: "devops" },
      "for-the-badge",
    );
    expect(forTheBadgeSvg).toContain("<svg");
    expect(forTheBadgeSvg).toContain("DEVOPS");
    expect(forTheBadgeSvg).toContain("92 A");
  });

  it("assigns appropriate rank configurations", () => {
    expect(getRankConfig(96).level).toBe("Rank 1");
    expect(getRankConfig(88).level).toBe("Rank 2");
    expect(getRankConfig(78).level).toBe("Rank 3");
    expect(getRankConfig(50).level).toBe("Normal");
  });
});
