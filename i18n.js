import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";

import en from "./locales/en.json";
import fr from "./locales/fr.json";
import es from "./locales/es.json";

const resources = {
  en: { translation: en },
  fr: { translation: fr },
  es: { translation: es },
};

const supportedLangs = Object.keys(resources);
const deviceCode = getLocales()[0]?.languageCode?.split(/[-_]/)[0] || "en";
const languageTag = supportedLangs.includes(deviceCode) ? deviceCode : "en";

i18n.use(initReactI18next).init({
  compatibilityJSON: "v3",
  resources,
  lng: languageTag,
  fallbackLng: "en",
  supportedLngs: supportedLangs,
  interpolation: { escapeValue: false },
});

export default i18n;
