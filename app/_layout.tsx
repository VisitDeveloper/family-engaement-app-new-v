import { useStore } from "@/store";
import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View, LogBox } from "react-native";

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
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Slot />;
}