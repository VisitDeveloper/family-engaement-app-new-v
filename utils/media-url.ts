/** True if URL points to a video asset (path or extension). Used for feed / composer. */
export function isVideoMediaUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  const u = url.toLowerCase();
  if (u.includes("/uploads/videos/")) return true;
  const path = u.split("?")[0] ?? "";
  return /\.(mp4|m4v|mov|webm|mpeg|mpg|avi|qt)$/i.test(path);
}
