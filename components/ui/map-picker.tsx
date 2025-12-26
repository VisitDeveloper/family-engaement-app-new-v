import { ThemedText } from "@/components/themed-text";
import { useThemedStyles } from "@/hooks/use-theme-style";
import { useStore } from "@/store";
import { Feather } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    TouchableOpacity,
    View,
} from "react-native";
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
        Alert.alert(
          "Permission Denied",
          "Location permission is required to use your current location."
        );
        setLoading(false);
        return;
      }

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
      Alert.alert("Error", "Failed to get your current location.");
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
      Alert.alert(
        "No Location Selected",
        "Please select a location on the map."
      );
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
            <ThemedText style={styles.headerTitle}>Select Location</ThemedText>
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
                  Map picker is not available on web platform.{"\n"}
                  Please use the mobile app to select a location.
                </ThemedText>
              </View>
            ) : (
              <>
                <MapView
                  style={styles.map}
                  region={region}
                  onRegionChangeComplete={setRegion}
                  onPress={handleMapPress}
                  showsUserLocation={true}
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
                        title="Selected Location"
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
                  ? "Location selected"
                  : "Tap on map to select location"}
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
                  My Location
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={handleConfirm}
                disabled={
                  selectedLatitude === null || selectedLongitude === null
                }
              >
                <ThemedText style={styles.buttonText}>Confirm</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
