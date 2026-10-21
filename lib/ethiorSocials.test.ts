import { describe, expect, it } from "vitest";
import { ETHIOR_SOCIALS } from "@/app/components/EthiorSocialLinks";
import {
  ETHIOR_FACEBOOK_URL,
  ETHIOR_GITHUB_URL,
  ETHIOR_INSTAGRAM_URL,
  ETHIOR_LINKEDIN_URL,
} from "@/lib/site";

describe("ETHIOR Social Media Presence", () => {
  it("contains all required social platforms", () => {
    const ids = ETHIOR_SOCIALS.map((s) => s.id);
    expect(ids).toContain("linkedin");
    expect(ids).toContain("instagram");
    expect(ids).toContain("facebook");
    expect(ids).toContain("github");
  });

  it("points to the official verified ETHIOR accounts", () => {
    const linkedin = ETHIOR_SOCIALS.find((s) => s.id === "linkedin");
    expect(linkedin?.url).toBe(ETHIOR_LINKEDIN_URL);
    expect(linkedin?.url).toBe("https://www.linkedin.com/company/ethior");

    const instagram = ETHIOR_SOCIALS.find((s) => s.id === "instagram");
    expect(instagram?.url).toBe(ETHIOR_INSTAGRAM_URL);
    expect(instagram?.url).toBe("https://www.instagram.com/ethiorhq/");

    const facebook = ETHIOR_SOCIALS.find((s) => s.id === "facebook");
    expect(facebook?.url).toBe(ETHIOR_FACEBOOK_URL);
    expect(facebook?.url).toBe("https://www.facebook.com/ethiorhq/");

    const github = ETHIOR_SOCIALS.find((s) => s.id === "github");
    expect(github?.url).toBe(ETHIOR_GITHUB_URL);
    expect(github?.url).toBe("https://github.com/ethiorhq");
  });

  it("each social item has non-empty hover styles and renders an SVG icon", () => {
    for (const social of ETHIOR_SOCIALS) {
      expect(social.hoverStyles).toBeTruthy();
      expect(typeof social.icon).toBe("function");
      const rendered = social.icon();
      expect(rendered).toBeTruthy();
    }
  });
});
