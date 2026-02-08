import { getLocales } from "expo-localization";

const MYMEMORY_URL = "https://api.mymemory.translated.net/get";

export type LangCode = string;

export const SUPPORTED_LANGUAGES: { code: LangCode; label: string }[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "hi", label: "हिन्दी" },
  { code: "zh-cn", label: "中文" },
  { code: "ja", label: "日本語" },
  { code: "fa", label: "فارسی" },
  { code: "ar", label: "العربية" },
];

export function detectSourceLanguage(text: string): LangCode {
  const t = text.trim();
  if (!t) return "en";
  const arabicPersianRegex = /[\u0600-\u06FF]/;
  let count = 0;
  let total = 0;
  for (const char of t) {
    if (/\s/.test(char)) continue;
    total++;
    if (arabicPersianRegex.test(char)) count++;
  }
  if (total === 0) return "en";
  return count / total >= 0.3 ? "fa" : "en";
}

export function getDeviceTargetLang(): LangCode {
  try {
    const locales = getLocales();
    const raw = locales[0]?.languageCode;
    const code = typeof raw === "string" ? raw.toLowerCase() : "";
    if (code === "ar" || code.startsWith("ar")) return "ar";
    if (code === "es" || code.startsWith("es")) return "es";
    if (code === "fr" || code.startsWith("fr")) return "fr";
    if (code === "hi" || code.startsWith("hi")) return "hi";
    if (code === "zh" || code.startsWith("zh")) return "zh-cn";
    if (code === "ja" || code.startsWith("ja")) return "ja";
    if (code === "fa" || code.startsWith("fa")) return "fa";
    return "en";
  } catch {
    return "en";
  }
}

function toLangCode(value: unknown): LangCode {
  if (typeof value === "string" && /^[a-z]{2}(-[a-z]{2})?$/i.test(value.trim())) {
    return value.trim().toLowerCase();
  }
  return "en";
}

export async function translateText(
  text: string,
  options?: { sourceLang?: LangCode | undefined; targetLang?: LangCode | undefined }
): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return text;

  const sourceLang = options?.sourceLang != null ? toLangCode(options.sourceLang) : detectSourceLanguage(trimmed);
  const targetLang = options?.targetLang != null ? toLangCode(options.targetLang) : getDeviceTargetLang();

  if (sourceLang === targetLang) return text;

  const langpair = `${sourceLang}|${targetLang}`;

  try {
    const url = `${MYMEMORY_URL}?q=${encodeURIComponent(trimmed)}&langpair=${encodeURIComponent(langpair)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.responseStatus !== 200 || !data.responseData?.translatedText) {
      return text;
    }
    return data.responseData.translatedText;
  } catch {
    return text;
  }
}
