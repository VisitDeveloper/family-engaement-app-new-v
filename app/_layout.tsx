import "@/i18n";
import { useStore } from "@/store";
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

  // Deep link: open chat when app is launched via group invite link (e.g. familyappengagement://chat/CONV_ID)
  useEffect(() => {
    if (!isMounted || !isLoggedIn) return;

    const handleInitialUrl = async () => {
      const url = await Linking.getInitialURL();
      if (!url) return;
      const parsed = Linking.parse(url);
      const path = parsed.path?.replace(/^\//, "") || "";
      const match = path.match(/^chat\/(.+)$/);
      if (match) {
        const chatId = match[1];
        router.replace({ pathname: "/chat/[chatID]", params: { chatID: chatId } });
      }
    };

    handleInitialUrl();
  }, [isMounted, isLoggedIn]);

  // When app is already open and user opens the same link
  useEffect(() => {
    if (!isLoggedIn) return;

    const sub = Linking.addEventListener("url", (event) => {
      const parsed = Linking.parse(event.url);
      const path = parsed.path?.replace(/^\//, "") || "";
      const match = path.match(/^chat\/(.+)$/);
      if (match) {
        const chatId = match[1];
        router.replace({ pathname: "/chat/[chatID]", params: { chatID: chatId } });
      }
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