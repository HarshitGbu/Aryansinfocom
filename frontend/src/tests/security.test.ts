import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isValidBlueprintCode,
  isValidSlug,
  resolveHttpOrigin,
  safeHref,
  safeInternalPath,
} from "@/lib/safe-url";
import { isValidEmail } from "@/lib/validation";
import { submitToWeb3Forms } from "@/lib/web3forms";
import { getBlueprint, getCaseStudy, getService } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/client";

describe("slug & blueprint validation", () => {
  it("accepts lowercase alphanumeric hyphenated slugs", () => {
    expect(isValidSlug("web-apps")).toBe(true);
    expect(isValidSlug("office-network-25-seats")).toBe(true);
    expect(isValidSlug("a1")).toBe(true);
  });

  it("rejects traversal, slashes, uppercase, query strings, and empty slugs", () => {
    for (const bad of [
      "",
      "../etc/passwd",
      "..%2f..%2fetc",
      "web/apps",
      "Web-Apps",
      "slug?foo=bar",
      "slug#hash",
      "slug with spaces",
      "a".repeat(129),
    ]) {
      expect(isValidSlug(bad)).toBe(false);
    }
  });

  it("validates blueprint codes safely", () => {
    expect(isValidBlueprintCode("BLUEPRINT-AIRGAP-25")).toBe(true);
    expect(isValidBlueprintCode("tier_1")).toBe(true);
    expect(isValidBlueprintCode("../secret")).toBe(false);
    expect(isValidBlueprintCode("a/b")).toBe(false);
    expect(isValidBlueprintCode("")).toBe(false);
  });
});

describe("safeInternalPath & safeHref", () => {
  it("keeps safe internal paths", () => {
    expect(safeInternalPath("/")).toBe("/");
    expect(safeInternalPath("/services/web-apps")).toBe("/services/web-apps");
    expect(safeInternalPath("/estimator?services=custom_web#step")).toBe(
      "/estimator?services=custom_web#step",
    );
  });

  it("rejects protocol-relative, backslash, external, and script URLs in safeInternalPath", () => {
    for (const bad of [
      "https://evil.com",
      "http://evil.com/path",
      "//evil.com",
      "///evil.com",
      "/\\evil.com",
      "javascript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "\x00/work",
      "/\tevil.com",
      "",
      null,
      undefined,
    ]) {
      expect(safeInternalPath(bad, "/fallback")).toBe("/fallback");
    }
  });

  it("allows internal paths and http(s) URLs in safeHref while blocking dangerous schemes", () => {
    expect(safeHref("/contact#book", "/")).toBe("/contact#book");
    expect(safeHref("https://cal.com/aryans/30min", "/contact#book")).toBe(
      "https://cal.com/aryans/30min",
    );
    expect(safeHref("http://localhost:3000/contact", "/contact#book")).toBe(
      "http://localhost:3000/contact",
    );

    for (const bad of [
      "//evil.com",
      "/\\evil.com",
      "javascript:alert(1)",
      "JAVASCRIPT:alert(1)",
      "data:text/html,xss",
      "vbscript:msgbox(1)",
      "mailto:test@example.com",
      "",
      null,
      undefined,
    ]) {
      expect(safeHref(bad, "/contact#book")).toBe("/contact#book");
    }
  });
});

describe("resolveHttpOrigin", () => {
  it("returns the origin for valid http and https URLs", () => {
    expect(resolveHttpOrigin("https://api.aryansinfocom.com/v1")).toBe(
      "https://api.aryansinfocom.com",
    );
    expect(resolveHttpOrigin("http://127.0.0.1:8000")).toBe("http://127.0.0.1:8000");
  });

  it("returns null for empty, missing, malformed, and non-HTTP(S) URLs", () => {
    for (const bad of [
      "",
      "   ",
      undefined,
      null,
      "not-a-url",
      "javascript:alert(1)",
      "data:text/plain,foo",
      "blob:https://aryansinfocom.com/123",
      "ftp://example.com",
    ]) {
      expect(resolveHttpOrigin(bad)).toBeNull();
    }
  });
});

describe("isValidEmail", () => {
  it("validates email syntax cleanly", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("  name+tag@sub.domain.co  ")).toBe(true);
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("a@b")).toBe(false);
    expect(isValidEmail("a@b.c")).toBe(false);
    expect(isValidEmail("user @example.com")).toBe(false);
  });
});

describe("submitToWeb3Forms honeypot guard", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("aborts without calling fetch when honeypot website is non-empty", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      submitToWeb3Forms("Test subject", {
        name: "Bot",
        email: "bot@example.com",
        website: "https://spam.example",
      }),
    ).resolves.toBeUndefined();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("aborts without calling fetch when botcheck is true", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      submitToWeb3Forms("Test subject", {
        name: "Bot",
        email: "bot@example.com",
        botcheck: true,
      }),
    ).resolves.toBeUndefined();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("submits with botcheck: false and strips website when honeypot is empty", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await submitToWeb3Forms("New contact", {
      name: "Alice",
      email: "alice@example.com",
      message: "Hello there, testing contact form.",
      website: "",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.web3forms.com/submit");
    expect(init.method).toBe("POST");
    const parsed = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(parsed.botcheck).toBe(false);
    expect(parsed).not.toHaveProperty("website");
    expect(parsed.subject).toBe("New contact");
    expect(parsed.email).toBe("alice@example.com");
  });
});

describe("API endpoint slug guards", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("rejects invalid slugs and blueprint codes before calling fetch", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(getService("../etc/passwd")).rejects.toBeInstanceOf(ApiError);
    await expect(getCaseStudy("foo/bar")).rejects.toBeInstanceOf(ApiError);
    await expect(getBlueprint("../secret")).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
