import { StateCreator } from "zustand";

export interface LanguageSlice {
  appLanguage: string; // Application language: 'en' or 'fa'
  setAppLanguage: (language: string) => void;
  getAcceptLanguage: () => string; // Convert to Accept-Language format (e.g., en-US or fa-IR)
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
