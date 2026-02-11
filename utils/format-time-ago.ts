/**
 * Formats a date string to a short "time ago" format
 * @param dateString - ISO date string
 * @returns Formatted string like "5m", "2h", "3d", or date
 */
export const formatTimeAgoShort = (dateString: string | Date, short: boolean = true): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return short ? "now" : "Just now";
  if (diffInSeconds < 3600) return short ? `${Math.floor(diffInSeconds / 60)}m` : `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return short ? `${Math.floor(diffInSeconds / 3600)}h` : `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return short ? `${Math.floor(diffInSeconds / 86400)}d` : `${Math.floor(diffInSeconds / 86400)} days ago`;
  return short ? date.toLocaleDateString() : date.toLocaleDateString();
};

