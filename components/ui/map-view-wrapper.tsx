import { Platform } from "react-native";

// Conditionally load react-native-maps
let MapViewComponent: any = null;
let MarkerComponent: any = null;

if (Platform.OS !== "web") {
  try {
    const Maps = require("react-native-maps");
    MapViewComponent = Maps.default;
    MarkerComponent = Maps.Marker;
  } catch (e) {
    // react-native-maps not available
  }
}

export { MapViewComponent as MapView, MarkerComponent as Marker };

