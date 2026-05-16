import { ThemedText } from "@/components/themed-text";
import MapPickerGoogleWeb from "@/components/ui/map-picker-google-web";
import { feedback } from "@/lib/feedback";
import {
  refreshMobileMapsConfigFromServer,
  resolveAndroidMapsApiKey,
  shouldUseWebMapsOnAndroid,
} from "@/lib/maps-client-config";
import { useThemedStyles } from "@/hooks/use-theme-style";
import { useStore } from "@/store";
import { Feather } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Modal, Platform, TouchableOpacity, View } from "react-native";
import { MapView, Marker } from "./map-view-wrapper";

// Define Region type manually
interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface MapPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectLocation: (latitude: number, longitude: number, locationName?: string) => void;
  initialLatitude?: number | null;
  initialLongitude?: number | null;
}

export default function MapPicker({
  visible,
  onClose,
  onSelectLocation,
  initialLatitude,
  initialLongitude,
}: MapPickerProps) {
  const { t } = useTranslation();
  const theme = useStore((state) => state.theme);
  const [selectedLatitude, setSelectedLatitude] = useState<number | null>(
    initialLatitude || null
  );
  const [selectedLongitude, setSelectedLongitude] = useState<number | null>(
    initialLongitude || null
  );
  const [region, setRegion] = useState<Region>({
    latitude: initialLatitude || 37.7749,
    longitude: initialLongitude || -122.4194,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [loading, setLoading] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [mapsBootstrapLoading, setMapsBootstrapLoading] = useState(false);
  const [androidMapsApiKey, setAndroidMapsApiKey] = useState<string | null>(null);
  const [useWebMaps, setUseWebMaps] = useState(false);
  const mapsBootstrapIdRef = useRef(0);

  useEffect(() => {
    if (!visible || Platform.OS !== "android") {
      setMapsBootstrapLoading(false);
      setAndroidMapsApiKey(null);
      setUseWebMaps(false);
      return;
    }

    const bootstrapId = ++mapsBootstrapIdRef.current;
    setMapsBootstrapLoading(true);
    setAndroidMapsApiKey(null);
    setUseWebMaps(false);

    (async () => {
      try {
        const config = await refreshMobileMapsConfigFromServer();
        if (bootstrapId !== mapsBootstrapIdRef.current) {
          return;
        }

        const effectiveKey = resolveAndroidMapsApiKey(config);
        const preferWeb = shouldUseWebMapsOnAndroid(config);

        setUseWebMaps(preferWeb);
        setAndroidMapsApiKey(effectiveKey || null);
      } catch (error) {
        console.error("Failed to refresh Google Maps config:", error);
        if (bootstrapId !== mapsBootstrapIdRef.current) {
          return;
        }
        setUseWebMaps(false);
        setAndroidMapsApiKey(null);
      } finally {
        if (bootstrapId === mapsBootstrapIdRef.current) {
          setMapsBootstrapLoading(false);
        }
      }
    })();
  }, [visible]);

  useEffect(() => {
    if (!visible || Platform.OS === "web") {
      return;
    }
    let cancelled = false;
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (cancelled) {
        return;
      }
      setHasLocationPermission(status === "granted");
    })();
    return () => {
      cancelled = true;
    };
  }, [visible]);

  useEffect(() => {
    if (initialLatitude && initialLongitude) {
      setSelectedLatitude(initialLatitude);
      setSelectedLongitude(initialLongitude);
      setRegion({
        latitude: initialLatitude,
        longitude: initialLongitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [initialLatitude, initialLongitude]);

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setHasLocationPermission(false);
        feedback.toast.info(t("mapPicker.permissionDeniedTitle"), t("mapPicker.permissionDeniedCurrentLocation"));
        setLoading(false);
        return;
      }
      setHasLocationPermission(true);

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      setSelectedLatitude(latitude);
      setSelectedLongitude(longitude);
      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch (error) {
      console.error("Error getting location:", error);
      feedback.toast.error(t("mapPicker.locationErrorTitle"), t("mapPicker.locationErrorMessage"));
    } finally {
      setLoading(false);
    }
  };

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLatitude(latitude);
    setSelectedLongitude(longitude);
  };

  const handleConfirm = async () => {
    if (selectedLatitude !== null && selectedLongitude !== null) {
      let locationName = "";
      
      // Try to get location name from reverse geocoding
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: selectedLatitude,
          longitude: selectedLongitude,
        });
        
        if (reverseGeocode && reverseGeocode.length > 0) {
          const address = reverseGeocode[0];
          // Build a readable address string
          const parts = [
            address.name,
            address.street,
            address.district,
            address.city,
            address.region,
            address.country,
          ].filter(Boolean);
          
          locationName = parts.join(", ") || `${selectedLatitude.toFixed(6)}, ${selectedLongitude.toFixed(6)}`;
        } else {
          locationName = `${selectedLatitude.toFixed(6)}, ${selectedLongitude.toFixed(6)}`;
        }
      } catch (error) {
        console.error("Error reverse geocoding:", error);
        // Fallback to coordinates if geocoding fails
        locationName = `${selectedLatitude.toFixed(6)}, ${selectedLongitude.toFixed(6)}`;
      }
      
      onSelectLocation(selectedLatitude, selectedLongitude, locationName);
      onClose();
    } else {
      feedback.toast.info(t("mapPicker.noLocationTitle"), t("mapPicker.noLocationMessage"));
    }
  };

  const styles = useThemedStyles((theme) => ({
    modalContainer: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      width: "90%",
      height: "80%",
      backgroundColor: theme.bg,
      borderRadius: 12,
      overflow: "hidden",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.text,
    },
    mapContainer: {
      flex: 1,
    },
    map: {
      flex: 1,
    },
    footer: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      gap: 12,
    },
    locationInfo: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    locationText: {
      fontSize: 14,
      color: theme.subText,
    },
    coordinatesText: {
      fontSize: 12,
      color: theme.subText,
      fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    },
    buttonRow: {
      flexDirection: "row",
      gap: 10,
    },
    button: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
    },
    primaryButton: {
      backgroundColor: theme.tint,
    },
    secondaryButton: {
      backgroundColor: theme.panel,
      borderWidth: 1,
      borderColor: theme.border,
    },
    buttonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
    secondaryButtonText: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "600",
    },
    loadingOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.3)",
      justifyContent: "center",
      alignItems: "center",
    },
  }));

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <ThemedText style={styles.headerTitle}>{t("mapPicker.title")}</ThemedText>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.mapContainer}>
            {Platform.OS === "web" || !MapView ? (
              <View
                style={[
                  styles.map,
                  {
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: theme.panel,
                  },
                ]}
              >
                <ThemedText
                  style={{
                    color: theme.subText,
                    textAlign: "center",
                    padding: 20,
                  }}
                >
                  {t("mapPicker.webUnavailable")}
                </ThemedText>
              </View>
            ) : Platform.OS === "android" && mapsBootstrapLoading ? (
              <View
                style={[
                  styles.map,
                  {
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: theme.panel,
                  },
                ]}
              >
                <ActivityIndicator size="large" color={theme.tint} />
                <ThemedText
                  style={{
                    color: theme.subText,
                    textAlign: "center",
                    padding: 20,
                    marginTop: 12,
                  }}
                >
                  {t("mapPicker.preparingMap")}
                </ThemedText>
              </View>
            ) : Platform.OS === "android" &&
              useWebMaps &&
              androidMapsApiKey ? (
              <MapPickerGoogleWeb
                apiKey={androidMapsApiKey}
                latitude={region.latitude}
                longitude={region.longitude}
                style={styles.map}
                onCoordinateChange={(latitude, longitude) => {
                  setSelectedLatitude(latitude);
                  setSelectedLongitude(longitude);
                  setRegion((prev) => ({
                    ...prev,
                    latitude,
                    longitude,
                  }));
                }}
              />
            ) : (
              <>
                <MapView
                  key={
                    Platform.OS === "android"
                      ? androidMapsApiKey ?? "default"
                      : "ios"
                  }
                  style={styles.map}
                  region={region}
                  onRegionChangeComplete={setRegion}
                  onPress={handleMapPress}
                  showsUserLocation={hasLocationPermission}
                  showsMyLocationButton={false}
                >
                  {selectedLatitude !== null &&
                    selectedLongitude !== null &&
                    Marker && (
                      <Marker
                        coordinate={{
                          latitude: selectedLatitude,
                          longitude: selectedLongitude,
                        }}
                        title={t("mapPicker.markerTitle")}
                      />
                    )}
                </MapView>
                {loading && (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={theme.tint} />
                  </View>
                )}
              </>
            )}
          </View>

          <View style={styles.footer}>
            <View style={styles.locationInfo}>
              <ThemedText style={styles.locationText}>
                {selectedLatitude !== null && selectedLongitude !== null
                  ? t("mapPicker.locationSelected")
                  : t("mapPicker.tapMapToSelect")}
              </ThemedText>
            </View>
            {selectedLatitude !== null && selectedLongitude !== null && (
              <ThemedText style={styles.coordinatesText}>
                {selectedLatitude.toFixed(6)}, {selectedLongitude.toFixed(6)}
              </ThemedText>
            )}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={getCurrentLocation}
                disabled={loading}
              >
                <Feather name="navigation" size={18} color={theme.text} />
                <ThemedText style={styles.secondaryButtonText}>
                  {t("mapPicker.myLocation")}
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={handleConfirm}
                disabled={
                  selectedLatitude === null || selectedLongitude === null
                }
              >
                <ThemedText style={styles.buttonText}>{t("buttons.confirm")}</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
