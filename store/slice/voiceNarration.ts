import * as Speech from "expo-speech";
import { StateCreator } from "zustand";

const SPEECH_LANGUAGE: Record<string, string> = {
  en: "en-US",
  fr: "fr-FR",
  es: "es-ES",
};

export interface VoiceNarrationSlice {
  voiceNarrationEnabled: boolean;
  toggleVoiceNarration: () => void;
  speak: (text: string, lang?: string) => void;
}

export const createVoiceNarrationSlice: StateCreator<
  VoiceNarrationSlice & { appLanguage?: string },
  [],
  [],
  VoiceNarrationSlice
> = (set, get) => ({
  voiceNarrationEnabled: false,

  toggleVoiceNarration: () => {
    const next = !get().voiceNarrationEnabled;
    if (!next) Speech.stop();
    set({ voiceNarrationEnabled: next });
  },

  speak: (text: string, lang?: string) => {
    const trimmed = text?.trim();
    if (!get().voiceNarrationEnabled || !trimmed) return;

    const appLang = get().appLanguage ?? "en";
    const language =
      lang ?? SPEECH_LANGUAGE[appLang] ?? SPEECH_LANGUAGE.en;

    Speech.stop();
    Speech.speak(trimmed, { language });
  },
});
