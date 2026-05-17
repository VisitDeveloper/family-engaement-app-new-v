import { setAudioModeAsync } from "expo-audio";

const baseMode = {
  playsInSilentMode: true,
  shouldPlayInBackground: false,
  interruptionMode: "duckOthers" as const,
};

/** Playback / video — default speaker route. */
export async function setPlaybackAudioMode(options?: {
  routeThroughEarpiece?: boolean;
}) {
  await setAudioModeAsync({
    ...baseMode,
    allowsRecording: false,
    shouldRouteThroughEarpiece: options?.routeThroughEarpiece ?? false,
  });
}

/** Voice message recording. */
export async function setRecordingAudioMode() {
  await setAudioModeAsync({
    ...baseMode,
    allowsRecording: true,
    shouldRouteThroughEarpiece: false,
  });
}
