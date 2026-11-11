const SLUG_RE = /^[a-z0-9-]+$/;
const BLUEPRINT_CODE_RE = /^[A-Za-z0-9_-]+$/;
const CONTROL_CHAR_RE = /[\u0000-\u001f\u007f]/;

export function isValidSlug(slug: string): boolean {
  return typeof slug === "string" && slug.length > 0 && slug.length <= 128 && SLUG_RE.test(slug);
}

export function isValidBlueprintCode(code: string): boolean {
  return (
    typeof code === "string" &&
    code.length > 0 &&
    code.length <= 128 &&
    BLUEPRINT_CODE_RE.test(code)
  );
}

/**
 * Validate an internal navigation path (e.g. from search results or router pushes).
 * Rejects protocol-relative URLs (`//evil.com`), backslash tricks (`/\evil.com`),
 * external schemes (`https:`, `javascript:`, `data:`), and control characters.
 */
export function safeInternalPath(href: string | null | undefined, fallback = "/"): string {
  if (typeof href !== "string") return fallback;
  const trimmed = href.trim();
  if (!trimmed || CONTROL_CHAR_RE.test(trimmed)) return fallback;
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
    return fallback;
  }
  try {
    const parsed = new URL(trimmed, "https://internal.invalid");
    if (parsed.origin !== "https://internal.invalid") return fallback;
  } catch {
    return fallback;
  }
  return trimmed;
}

/**
 * Validate a link href that may point either to an internal path or an external
 * http(s) URL (blocking `javascript:`, `data:`, `vbscript:`, `//`, etc.).
 */
export function safeHref(url: string | null | undefined, fallback = "/"): string {
  if (typeof url !== "string") return fallback;
  const trimmed = url.trim();
  if (!trimmed || CONTROL_CHAR_RE.test(trimmed)) return fallback;
  if (trimmed.startsWith("/")) {
    return safeInternalPath(trimmed, fallback);
  }
  try {
    const parsed = new URL(trimmed);
    if ((parsed.protocol === "https:" || parsed.protocol === "http:") && parsed.hostname) {
      return trimmed;
    }
  } catch {
    return fallback;
  }
  return fallback;
}

/**
 * Resolve an HTTP(S) origin (`scheme://host[:port]`) for allowlists such as CSP `connect-src`.
 * Rejects non-hierarchical or non-HTTP(S) schemes (`javascript:`, `data:`, `blob:`, `ftp:`)
 * so opaque `"null"` origins cannot be emitted into headers.
 */
export function resolveHttpOrigin(raw: string | null | undefined): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed || CONTROL_CHAR_RE.test(trimmed)) return null;
  try {
    const parsed = new URL(trimmed);
    if (
      (parsed.protocol === "http:" || parsed.protocol === "https:") &&
      parsed.hostname &&
      parsed.origin !== "null"
    ) {
      return parsed.origin;
    }
    return null;
  } catch {
    return null;
  }
}
