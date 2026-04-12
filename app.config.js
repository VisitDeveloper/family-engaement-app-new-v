// Build-time Google Maps keys (required for Android native MapView in the binary).
// Optional org-level overrides are returned from GET /auth/profile (see lib/maps-client-config.ts);
// the native SDK still reads the manifest key baked in here — rotate that key via EAS rebuild
// when you change the org default in the portal, or keep them identical.
const appJson = require("./app.json");

const androidKey =
  process.env.GOOGLE_MAPS_ANDROID_API_KEY ||
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY ||
  "";

const iosKey = process.env.GOOGLE_MAPS_IOS_API_KEY || "";

module.exports = () => ({
  ...appJson,
  expo: {
    ...appJson.expo,
    android: {
      ...appJson.expo.android,
      config: {
        ...appJson.expo.android?.config,
        googleMaps: { apiKey: androidKey },
      },
    },
    ios: {
      ...appJson.expo.ios,
      config: {
        ...appJson.expo.ios?.config,
        ...(iosKey ? { googleMapsApiKey: iosKey } : {}),
      },
    },
  },
});
