import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as RNLocalize from "react-native-localize";

import en from "./locales/en.json";
import fa from "./locales/fa.json";

const resources = {
    en: { translation: en },
    fa: { translation: fa },
};

const fallback = { languageTag: "en", isRTL: false };

const { languageTag } = RNLocalize.findBestAvailableLanguage(Object.keys(resources)) || fallback;

i18n.use(initReactI18next).init({
    compatibilityJSON: "v3",
    resources,
    lng: languageTag,
    fallbackLng: "en",
    interpolation: { escapeValue: false },
});

export default i18n;
