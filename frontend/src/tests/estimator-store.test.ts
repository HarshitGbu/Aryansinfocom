import { describe, expect, it } from "vitest";
import { needsOffice, needsSoftware } from "@/lib/stores/estimator-store";

describe("estimator steps", () => {
  it("requires office only for infra services", () => {
    expect(needsOffice(["custom_web"])).toBe(false);
    expect(needsOffice(["office_networking"])).toBe(true);
    expect(needsOffice(["local_ai_server"])).toBe(true);
  });
  it("requires software only for software services", () => {
    expect(needsSoftware(["office_networking"])).toBe(false);
    expect(needsSoftware(["erp_custom"])).toBe(true);
  });
});
