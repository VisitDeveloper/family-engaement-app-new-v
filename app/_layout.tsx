import { PushNotificationData, usePushNotifications } from "@/hooks/usePushNotifications";
import "@/i18n";
import { useStore } from "@/store";
import { handleDeepLink } from "@/utils/deep-linking";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import * as Linking from "expo-linking";
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

  // Handler for notification clicks
  const handleNotificationClick = (data: PushNotificationData) => {
    // If deepLink exists, use it
    if (data.deepLink) {
      handleDeepLink(data.deepLink);
      return;
    }

    // Otherwise, navigate based on type
    if (data.type === 'message' && data.conversationId) {
      console.log(`familyappengagement://chat/${data.conversationId}`);
      handleDeepLink(`familyappengagement://chat/${data.conversationId}`);
    } else if (data.type === 'emergency') {
      router.push('/(protected)/emergency-notifications');
    } else if (data.type === 'event' && data.eventId) {
      handleDeepLink(`familyappengagement://event/${data.eventId}`);
    }
  };

  // Initialize push notifications
  usePushNotifications(handleNotificationClick);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || segments === undefined) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (isLoggedIn && inAuthGroup) {
      router.replace("/(protected)/(tabs)");
    } else if (!isLoggedIn && !inAuthGroup) {
      router.replace("/(auth)/login");
    }
  }, [isLoggedIn, segments, isMounted]);

  // Deep link: handle initial URL when app is launched via deep link
  // Supports: chat, contact, group, event, resource, feed, profile
  useEffect(() => {
    if (!isMounted || !isLoggedIn) return;

    const handleInitialUrl = async () => {
      const url = await Linking.getInitialURL();
      if (!url) return;
      handleDeepLink(url);
    };

    handleInitialUrl();
  }, [isMounted, isLoggedIn]);

  // When app is already open and user opens a deep link
  useEffect(() => {
    if (!isLoggedIn) return;

    const sub = Linking.addEventListener("url", (event) => {
      handleDeepLink(event.url);
    });

    return () => sub.remove();
  }, [isLoggedIn]);

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