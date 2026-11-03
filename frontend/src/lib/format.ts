import type { Range } from "@/lib/api/types";

export function formatUSD(value: number): string {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

export function formatRange(range: Range): string {
  if (range.min === range.max) return formatUSD(range.min);
  return `${formatUSD(range.min)} – ${formatUSD(range.max)}`;
}

export function formatWeeks(range: Range): string {
  if (range.min === range.max) {
    return range.min === 1 ? "1 week" : `${range.min} weeks`;
  }
  return `${range.min}–${range.max} weeks`;
}

export function slugify(heading: string): string {
  return heading.toLowerCase().replace(/\s+/g, "-");
}

export function formatRetryAfter(seconds: number): string {
  if (seconds < 60) return `${seconds} seconds`;
  const minutes = Math.ceil(seconds / 60);
  return minutes === 1 ? "1 minute" : `${minutes} minutes`;
}
