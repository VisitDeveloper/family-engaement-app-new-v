const INVALID_NAME_PARTS = new Set(["null", "undefined"]);

const normalizeNamePart = (value: unknown): string => {
  if (value === null || value === undefined) return "";

  const cleaned = String(value).trim();
  if (!cleaned) return "";

  return INVALID_NAME_PARTS.has(cleaned.toLowerCase()) ? "" : cleaned;
};

export const getDisplayName = (
  firstName: unknown,
  lastName: unknown,
  fallback = "Unknown"
): string => {
  const parts = [normalizeNamePart(firstName), normalizeNamePart(lastName)].filter(
    Boolean
  );

  if (parts.length > 0) {
    return parts.join(" ");
  }

  const normalizedFallback = normalizeNamePart(fallback);
  return normalizedFallback || "Unknown";
};

export const getInitials = (
  firstName: unknown,
  lastName: unknown,
  fallbackText = "?"
): string => {
  const first = normalizeNamePart(firstName);
  const last = normalizeNamePart(lastName);
  const initials = `${first.charAt(0)}${last.charAt(0)}`.toUpperCase().trim();

  if (initials) return initials;

  const fallback = normalizeNamePart(fallbackText);
  return fallback.charAt(0).toUpperCase() || "?";
};
