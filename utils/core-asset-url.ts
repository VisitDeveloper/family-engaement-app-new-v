/**
 * Same base as {@link ApiClient} in services/api.ts — must match the host that serves GET /uploads/...
 */
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3006";

function trimTrailingSlashes(s: string): string {
  return s.replace(/\/+$/, "");
}

/**
 * Resolves resource image/content URLs for this app: relative `/uploads/...` gets the API origin,
 * and absolute URLs whose path is under `/uploads/` use the API origin (fixes FILE_BASE_URL ≠ EXPO_PUBLIC_API_URL).
 */
export function resolveCoreAssetUrl(path: string | null | undefined): string {
  if (path == null || typeof path !== "string") return "";
  const trimmed = path.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("/uploads/")) {
    return `${trimTrailingSlashes(API_BASE_URL)}${trimmed}`;
  }

  try {
    const u = new URL(trimmed);
    if (u.pathname.startsWith("/uploads/")) {
      return `${trimTrailingSlashes(API_BASE_URL)}${u.pathname}${u.search}`;
    }
  } catch {
    // not parseable as absolute URL — return as-is (e.g. legacy scheme)
  }

  return trimmed;
}
