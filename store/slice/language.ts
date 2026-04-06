import { StateCreator } from "zustand";

/** Locales shipped in the app (must match i18n resources). */
const NON_ENGLISH_LOCALES = new Set(["es", "fr"]);

/**
 * After GET profile, the API always includes `appLanguage` merged with defaults (`en`).
 * If the user chose Spanish/French on this device but the server still has the default,
 * applying the server value would incorrectly reset the UI to English.
 */
export function mergeProfileAppLanguage(
  serverLang: string | undefined | null,
  localLang: string | undefined | null
): string | undefined {
  if (!serverLang) return undefined;
  const local = localLang || "en";
  if (
    serverLang === "en" &&
    local !== "en" &&
    NON_ENGLISH_LOCALES.has(local)
  ) {
    return local;
  }
  return serverLang;
}

/** When merged language differs from profile, PATCH so the server matches the device. */
export function shouldPushAppLanguageToServer(
  profileAppLanguage: string | undefined | null,
  effectiveAppLanguage: string
): boolean {
  return (
    profileAppLanguage != null &&
    profileAppLanguage !== effectiveAppLanguage
  );
}

export interface LanguageSlice {
  appLanguage: string; // Application language: 'en' | 'fr' | 'es'
  setAppLanguage: (language: string) => void;
  getAcceptLanguage: () => string; // For API Accept-Language header
}

export const createLanguageSlice: StateCreator<any, [], [], LanguageSlice> = (set, get) => {
  return {
    appLanguage: "en", // Default: English

    setAppLanguage: (language: string) => {
      set({ appLanguage: language });
    },

    getAcceptLanguage: () => {
      const { appLanguage } = get();
      // Convert language code to Accept-Language format
      // en -> en-US, fr -> fr-FR
      const languageMap: Record<string, string> = {
        en: "en",
        fr: "fr",
        es: "es",
      };
      return languageMap[appLanguage] || "en";
    },
  };
};
