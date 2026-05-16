import { useMemo } from "react";
import { StyleSheet, type ViewStyle } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

interface MapPickerGoogleWebProps {
  apiKey: string;
  latitude: number;
  longitude: number;
  style?: ViewStyle;
  onCoordinateChange: (latitude: number, longitude: number) => void;
}

function buildGoogleMapsPickerHtml(
  apiKey: string,
  latitude: number,
  longitude: number
): string {
  const lat = Number(latitude.toFixed(6));
  const lng = Number(longitude.toFixed(6));

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
    />
    <style>
      html, body, #map { height: 100%; margin: 0; padding: 0; }
    </style>
    <script src="https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}"></script>
  </head>
  <body>
    <div id="map"></div>
    <script>
      (function () {
        const start = { lat: ${lat}, lng: ${lng} };
        let marker = null;
        const map = new google.maps.Map(document.getElementById("map"), {
          center: start,
          zoom: 15,
          gestureHandling: "greedy",
          mapTypeControl: false,
          streetViewControl: false,
        });

        function postSelection(lat, lng) {
          if (!window.ReactNativeWebView) return;
          window.ReactNativeWebView.postMessage(
            JSON.stringify({ type: "selection", latitude: lat, longitude: lng })
          );
        }

        marker = new google.maps.Marker({
          position: start,
          map,
          draggable: true,
        });

        marker.addListener("dragend", function () {
          const p = marker.getPosition();
          postSelection(p.lat(), p.lng());
        });

        map.addListener("click", function (e) {
          marker.setPosition(e.latLng);
          postSelection(e.latLng.lat(), e.latLng.lng());
        });

        postSelection(start.lat, start.lng);
      })();
    </script>
  </body>
</html>`;
}

export default function MapPickerGoogleWeb({
  apiKey,
  latitude,
  longitude,
  style,
  onCoordinateChange,
}: MapPickerGoogleWebProps) {
  const html = useMemo(
    () => buildGoogleMapsPickerHtml(apiKey, latitude, longitude),
    [apiKey, latitude, longitude]
  );

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data) as {
        type?: string;
        latitude?: number;
        longitude?: number;
      };
      if (
        data.type === "selection" &&
        typeof data.latitude === "number" &&
        typeof data.longitude === "number"
      ) {
        onCoordinateChange(data.latitude, data.longitude);
      }
    } catch {
      // ignore malformed messages
    }
  };

  return (
    <WebView
      key={`${apiKey}:${latitude}:${longitude}`}
      style={[styles.map, style]}
      source={{ html, baseUrl: "https://localhost" }}
      onMessage={handleMessage}
      javaScriptEnabled
      domStorageEnabled
      originWhitelist={["*"]}
      setSupportMultipleWindows={false}
    />
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
