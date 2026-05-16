// Build-time Google Maps keys (Android native MapView fallback in the binary).
// Portal keys are fetched before the map opens (see lib/maps-client-config.ts and map-picker.tsx).
// When the portal key differs from this build key, Android uses the Maps JavaScript API instead.
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
