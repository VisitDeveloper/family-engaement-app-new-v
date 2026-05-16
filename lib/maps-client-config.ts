import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

import { apiClient } from "@/services/api";
import type { ProfileResponseDto } from "@/types/user.types";

const STORAGE_KEY = "@mebo/mobile_maps_config_v1";

export type MobileMapsConfigPayload = NonNullable<
  ProfileResponseDto["mobileMapsConfig"]
>;

/**
 * Caches server-wide map keys from GET /auth/profile (portal DB overrides env).
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

/** Fetch latest map keys from the server and update the local cache. */
export async function refreshMobileMapsConfigFromServer(): Promise<MobileMapsConfigPayload | null> {
  const profile = await apiClient.get<ProfileResponseDto>("/auth/profile");
  await persistMobileMapsConfigFromProfile(profile);
  return profile.mobileMapsConfig ?? (await getCachedMobileMapsConfig());
}

/** Portal/server key when set, otherwise the build-time manifest key. */
export function resolveAndroidMapsApiKey(
  config: MobileMapsConfigPayload | null
): string {
  const server = config?.googleMapsAndroidApiKey?.trim() ?? "";
  const build = getBuildTimeGoogleMapsAndroidApiKey().trim();
  return server || build;
}

/**
 * When the portal key differs from the EAS manifest key, native MapView cannot
 * reliably pick up the new key after Maps SDK has initialized — use JS Maps instead.
 */
export function shouldUseWebMapsOnAndroid(
  config: MobileMapsConfigPayload | null
): boolean {
  const server = config?.googleMapsAndroidApiKey?.trim() ?? "";
  const build = getBuildTimeGoogleMapsAndroidApiKey().trim();
  return !!server && server !== build;
}
