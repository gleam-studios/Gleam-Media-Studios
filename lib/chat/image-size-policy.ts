import type { ImageSizeTier } from "@/lib/image-workspace";

const FOUR_K_PATTERNS: RegExp[] = [
  /\b4k\b/i,
  /\b2160p\b/i,
  /超高清|超清|4k画质|4k分辨率|最高画质|最高分辨率|原画级|影院级/,
];

const ONE_K_PATTERNS: RegExp[] = [
  /\b1k\b/i,
  /\b1024(?:x1024)?\b/i,
  /低清|草稿|草图|快速出图|先粗出|先看看/,
];

const TWO_K_PATTERNS: RegExp[] = [
  /\b2k\b/i,
  /\b1440p\b/i,
  /高清|高分辨率|精细一点|细节更清楚|清晰一些|高质量/,
];

function compact(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function matchSizeFromText(text: string): ImageSizeTier | undefined {
  const normalized = compact(text);
  if (!normalized) return undefined;
  if (FOUR_K_PATTERNS.some((re) => re.test(normalized))) return "4K";
  if (ONE_K_PATTERNS.some((re) => re.test(normalized))) return "1K";
  if (TWO_K_PATTERNS.some((re) => re.test(normalized))) return "2K";
  return undefined;
}

function collectStrings(value: unknown, out: string[]): void {
  if (typeof value === "string") {
    const text = compact(value);
    if (text) out.push(text);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, out);
    return;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectStrings(item, out);
  }
}

export function normalizeImageSize(value: unknown): ImageSizeTier | undefined {
  if (value === "1K" || value === "2K" || value === "4K") return value;
  if (typeof value !== "string") return undefined;
  const upper = value.trim().toUpperCase();
  if (upper === "1K" || upper === "2K" || upper === "4K") return upper as ImageSizeTier;
  return matchSizeFromText(upper);
}

export function resolveImageSizeFromUserRequest(params: {
  explicit?: unknown;
  texts?: Array<string | undefined | null>;
  fallback?: ImageSizeTier;
}): ImageSizeTier {
  const explicit = normalizeImageSize(params.explicit);
  if (explicit) return explicit;

  for (const text of params.texts || []) {
    const resolved = typeof text === "string" ? matchSizeFromText(text) : undefined;
    if (resolved) return resolved;
  }

  return params.fallback ?? "2K";
}

export function resolveImageSizeFromUnknownRecord(
  record: Record<string, unknown> | undefined,
  fallback?: ImageSizeTier,
): ImageSizeTier {
  if (!record) return fallback ?? "2K";
  const direct =
    normalizeImageSize(record.image_size) ??
    normalizeImageSize(record.imageSize) ??
    normalizeImageSize(record.resolution) ??
    normalizeImageSize(record.quality);
  if (direct) return direct;

  const texts: string[] = [];
  collectStrings(record, texts);
  return resolveImageSizeFromUserRequest({ texts, fallback });
}
