import { describe, expect, it } from "vitest";
import { formatRange, formatUSD, formatWeeks, slugify } from "@/lib/format";

describe("format", () => {
  it("formats USD", () => {
    expect(formatUSD(12000)).toBe("$12,000");
  });
  it("formats ranges", () => {
    expect(formatRange({ min: 12000, max: 16000 })).toBe("$12,000 – $16,000");
    expect(formatRange({ min: 5000, max: 5000 })).toBe("$5,000");
  });
  it("formats weeks", () => {
    expect(formatWeeks({ min: 6, max: 10 })).toBe("6–10 weeks");
    expect(formatWeeks({ min: 4, max: 4 })).toBe("4 weeks");
  });
  it("slugifies headings for anchors", () => {
    expect(slugify("Delivery model")).toBe("delivery-model");
    expect(slugify("Overview")).toBe("overview");
  });
});
