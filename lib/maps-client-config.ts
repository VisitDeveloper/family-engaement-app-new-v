import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

import type { ProfileResponseDto } from "@/types/user.types";

const STORAGE_KEY = "@mebo/mobile_maps_config_v1";

export type MobileMapsConfigPayload = NonNullable<
  ProfileResponseDto["mobileMapsConfig"]
>;

/**
 * Caches server-wide map keys from GET /auth/profile (portal DB overrides env).
 *
 * Note: `react-native-maps` on Android reads the Google Maps API key from the
 * native manifest (baked at EAS build via app.config.js). This cache does not
 * replace that manifest key at runtime.
 */
export async function persistMobileMapsConfigFromProfile(
  profile: ProfileResponseDto
): Promise<void> {
  if (!profile.mobileMapsConfig) {
    return;
  }
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(profile.mobileMapsConfig)
  );
}

export async function getCachedMobileMapsConfig(): Promise<MobileMapsConfigPayload | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MobileMapsConfigPayload;
  } catch {
    return null;
  }
}

/** Key embedded in the Android binary (Expo prebuild / EAS env). */
export function getBuildTimeGoogleMapsAndroidApiKey(): string {
  const fromExpo =
    Constants.expoConfig?.android?.config?.googleMaps?.apiKey ?? "";
  if (fromExpo) return fromExpo;
  return process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY ?? "";
}
