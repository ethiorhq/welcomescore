import { describe, expect, it } from "vitest";
import {
  generateAuditReportLd,
  generateBreadcrumbLd,
  generateDevOpsAuditLd,
  generateOrgFleetLd,
  generateToolSoftwareLd,
  stringifyJsonLd,
} from "./schemaLd";
import { validReportFixture } from "./report/fixtures";

describe("Schema.org JSON-LD structured data generators", () => {
  it("generates valid BreadcrumbList schema", () => {
    const breadcrumbs = generateBreadcrumbLd([
      { name: "Home", path: "/" },
      { name: "DevOps", path: "/devops" },
    ]);

    expect(breadcrumbs["@type"]).toBe("BreadcrumbList");
    expect(breadcrumbs.itemListElement.length).toBe(2);
    expect(breadcrumbs.itemListElement[0].name).toBe("Home");
    expect(breadcrumbs.itemListElement[1].name).toBe("DevOps");
  });

  it("generates valid SoftwareApplication tool schema", () => {
    const tool = generateToolSoftwareLd(
      "DevOps Doctor",
      "/devops",
      "CI/CD workflow analyzer",
    );

    expect(tool["@type"]).toBe("SoftwareApplication");
    expect(tool.name).toBe("DevOps Doctor");
    expect(tool.offers.price).toBe("0");
    expect(tool.publisher.name).toBe("ETHIOR");
  });

  it("generates comprehensive TechArticle and AuditReport schema for repositories", () => {
    const schema = generateAuditReportLd("ethiorhq", "welcomescore", validReportFixture);
    expect(schema["@context"]).toBe("https://schema.org");
    expect(Array.isArray(schema["@graph"])).toBe(true);

    const article = schema["@graph"].find(
      (item) => (item as Record<string, unknown>)["@type"] === "TechArticle",
    ) as Record<string, unknown> | undefined;
    expect(article).toBeDefined();
    expect(String(article?.headline)).toContain("ethiorhq/welcomescore");
    expect((article?.author as Record<string, unknown>)?.name).toBe("ETHIOR");

    const audit = schema["@graph"].find(
      (item) => (item as Record<string, unknown>)["@type"] === "SoftwareApplication",
    ) as Record<string, unknown> | undefined;
    expect(audit).toBeDefined();
    expect((audit?.aggregateRating as Record<string, unknown>)?.ratingValue).toBe(85);
  });

  it("generates DevOps and Fleet schemas with clean JSON-LD stringification", () => {
    const devops = generateDevOpsAuditLd("facebook", "react");
    expect(devops["@graph"].length).toBe(2);

    const fleet = generateOrgFleetLd("facebook");
    expect(fleet["@graph"].length).toBe(2);

    const jsonStr = stringifyJsonLd(fleet);
    expect(jsonStr).not.toContain("<script");
    expect(JSON.parse(jsonStr)).toEqual(fleet);
  });
});
