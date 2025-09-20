import * as Speech from "expo-speech";
import { StateCreator } from "zustand";

export interface VoiceNarrationSlice {
  voiceNarrationEnabled: boolean;
  toggleVoiceNarration: () => void;
  speak: (text: string, lang?: string) => void;
}

export const createVoiceNarrationSlice: StateCreator<
  VoiceNarrationSlice,
  [],
  [],
  VoiceNarrationSlice
> = (set, get) => ({
  voiceNarrationEnabled: false,

  toggleVoiceNarration: () =>
    set((state) => ({
      voiceNarrationEnabled: !state.voiceNarrationEnabled,
    })),

  speak: (text: string, lang: string = "fa-IR") => {
    if (get().voiceNarrationEnabled) {
      Speech.speak(text, { language: lang });
    }
  },
});
