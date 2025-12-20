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
      // اضافه کردن شرط segments.length > 0 برای جلوگیری از هدایت در رندر اولیه که segments خالی است.
      // همچنین ممکن است بخواهید مسیرهای عمومی که نیاز به احراز هویت ندارند را در اینجا استثنا کنید.
      // مثلا: if (!isLoggedIn && !inAuthGroup && segments[0] !== 'public-page')
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