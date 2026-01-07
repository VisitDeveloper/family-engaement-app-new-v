import { useStore } from "@/store";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, LogBox, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Disable LogBox
LogBox.ignoreAllLogs();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const isLoggedIn = useStore((s) => s.isLoggedIn);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || segments === undefined) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (isLoggedIn && inAuthGroup) {
      router.replace("/(protected)/(tabs)");
    } else if (!isLoggedIn && !inAuthGroup) {
      // Add condition segments.length > 0 to prevent redirect on initial render when segments is empty.
      // You may also want to exclude public routes that don't require authentication here.
      // For example: if (!isLoggedIn && !inAuthGroup && segments[0] !== 'public-page')
      router.replace("/(auth)/login");
    }

  }, [isLoggedIn, segments, isMounted]);

  if (!isMounted) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BottomSheetModalProvider>
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" />
          </View>
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <Slot />
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}