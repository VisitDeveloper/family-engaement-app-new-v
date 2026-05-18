import { useStore } from "@/store";
import { extractTextFromChildren } from "@/utils/extract-text-from-children";
import { useCallback, useMemo, type ReactNode } from "react";

export function resolveSpeechText(
  children: ReactNode,
  readString?: string
): string {
  const explicit = readString?.trim();
  if (explicit) return explicit;
  return extractTextFromChildren(children);
}

/** Tap-to-speak helpers when voice narration is enabled in settings. */
export function useVoiceText(children: ReactNode, readString?: string) {
  const voiceEnabled = useStore((state) => state.voiceNarrationEnabled);
  const speak = useStore((state) => state.speak);

  const speechText = useMemo(
    () => resolveSpeechText(children, readString),
    [children, readString]
  );

  const onSpeak = useCallback(() => {
    if (speechText) speak(speechText);
  }, [speechText, speak]);

  return { voiceEnabled, speechText, onSpeak };
}

/** Merge voice narration with an existing press handler. */
export function useSpeakablePress(
  text: string,
  onPress?: () => void
): (() => void) | undefined {
  const voiceEnabled = useStore((state) => state.voiceNarrationEnabled);
  const speak = useStore((state) => state.speak);

  if (!voiceEnabled && !onPress) return undefined;

  return () => {
    const trimmed = text.trim();
    if (voiceEnabled && trimmed) speak(trimmed);
    onPress?.();
  };
}
