type LocaleLike = { languageCode?: string | null };

function fallbackLocales(): LocaleLike[] {
  const code =
    typeof navigator !== "undefined" && navigator.language
      ? navigator.language.split(/[-_]/)[0]
      : "en";
  return [{ languageCode: code ?? "en" }];
}

/** Safe wrapper when the dev client was built without expo-localization linked. */
export function getDeviceLocales(): LocaleLike[] {
  try {
    const { getLocales } = require("expo-localization") as typeof import("expo-localization");
    return getLocales();
  } catch {
    return fallbackLocales();
  }
}

export function getDeviceLanguageCode(defaultCode = "en"): string {
  const raw = getDeviceLocales()[0]?.languageCode;
  const code = typeof raw === "string" ? raw.split(/[-_]/)[0] : defaultCode;
  return code || defaultCode;
}
