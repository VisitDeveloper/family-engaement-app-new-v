/**
 * Same base as {@link ApiClient} in services/api.ts — must match the host that serves GET /uploads/...
 */
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3006";

function trimTrailingSlashes(s: string): string {
  return s.replace(/\/+$/, "");
}

function isLoopbackHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

/**
 * Resolves resource image/content URLs for this app.
 * - Relative `/uploads/...` → EXPO_PUBLIC_API_URL
 * - Absolute loopback URLs on device → API URL when API is a reachable LAN host
 * - Absolute LAN/public URLs from FILE_BASE_URL → kept as-is (do not force localhost)
 */
export function resolveCoreAssetUrl(path: string | null | undefined): string {
  if (path == null || typeof path !== "string") return "";
  const trimmed = path.trim();
  if (!trimmed) return "";

  const apiBase = trimTrailingSlashes(API_BASE_URL);

  if (trimmed.startsWith("/uploads/")) {
    return `${apiBase}${trimmed}`;
  }

  try {
    const u = new URL(trimmed);
    if (!u.pathname.startsWith("/uploads/")) {
      return trimmed;
    }

    let api: URL;
    try {
      api = new URL(apiBase);
    } catch {
      return trimmed;
    }

    const assetLoopback = isLoopbackHost(u.hostname);
    const apiLoopback = isLoopbackHost(api.hostname);

    // Simulator: both loopback — keep stored URL
    if (assetLoopback && apiLoopback) {
      return trimmed;
    }

    // Server returned localhost but app targets LAN IP — rewrite to API host
    if (assetLoopback && !apiLoopback) {
      return `${apiBase}${u.pathname}${u.search}`;
    }

    // Server returned LAN/public URL — device should use it directly
    if (!assetLoopback) {
      return trimmed;
    }

    return `${apiBase}${u.pathname}${u.search}`;
  } catch {
    return trimmed;
  }
}
