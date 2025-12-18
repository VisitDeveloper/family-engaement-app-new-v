import { StateCreator } from "zustand";

export interface LanguageSlice {
  appLanguage: string; // زبان اپلیکیشن: 'en' یا 'fa'
  setAppLanguage: (language: string) => void;
  getAcceptLanguage: () => string; // تبدیل به فرمت Accept-Language (مثلاً en-US یا fa-IR)
}

export const createLanguageSlice: StateCreator<any, [], [], LanguageSlice> = (set, get) => {
  return {
    appLanguage: "en", // پیش‌فرض: انگلیسی

    setAppLanguage: (language: string) => {
      set({ appLanguage: language });
    },

    getAcceptLanguage: () => {
      const { appLanguage } = get();
      // تبدیل کد زبان به فرمت Accept-Language
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
