import { useStore } from "@/store";
import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Toaster } from "sonner-native";

const shadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
  },
  android: { elevation: 12 },
  default: {},
});

export function FeedbackToaster() {
  const colorScheme = useStore((s) => s.colorScheme);
  const theme = useStore((s) => s.theme);
  const isDark = colorScheme === "dark";

  const iconCapsuleBg = theme.bg;

  const toastOptions = useMemo(
    () => ({
      toastContainerStyle: {
        paddingHorizontal: 14,
        paddingVertical: 6,
      },
      style: {
        backgroundColor: theme.panel,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.border,
        ...shadow,
      },
      toastContentStyle: {
        gap: 14,
        alignItems: "flex-start" as const,
      },
      textContainerStyle: {
        flex: 1,
        minWidth: 0,
      },
      titleStyle: {
        fontSize: 15,
        fontWeight: "700" as const,
        letterSpacing: -0.35,
        lineHeight: 20,
        color: theme.text,
      },
      descriptionStyle: {
        fontSize: 13,
        fontWeight: "400" as const,
        letterSpacing: -0.1,
        lineHeight: 18,
        marginTop: 2,
        color: theme.subText,
        opacity: 1,
      },
      success: {
        backgroundColor: theme.panel,
        borderColor: theme.border,
        borderWidth: 1,
      },
      error: {
        backgroundColor: theme.panel,
        borderColor: theme.border,
        borderWidth: 1,
      },
      info: {
        backgroundColor: theme.panel,
        borderColor: theme.border,
        borderWidth: 1,
      },
    }),
    [theme.border, theme.panel, theme.text, theme.subText]
  );

  const icons = useMemo(
    () => ({
      success: (
        <View style={[iconWrap.base, { backgroundColor: iconCapsuleBg, borderColor: theme.border, borderWidth: 1 }]}>
          <Ionicons name="checkmark-circle" size={28} color="#22c55e" />
        </View>
      ),
      error: (
        <View style={[iconWrap.base, { backgroundColor: iconCapsuleBg, borderColor: theme.border, borderWidth: 1 }]}>
          <Ionicons name="alert-circle" size={28} color={theme.emergencyColor} />
        </View>
      ),
      info: (
        <View style={[iconWrap.base, { backgroundColor: iconCapsuleBg, borderColor: theme.border, borderWidth: 1 }]}>
          <Ionicons name="sparkles" size={24} color={theme.tint} />
        </View>
      ),
    }),
    [iconCapsuleBg, theme.border, theme.emergencyColor, theme.tint]
  );

  return (
    <Toaster
      theme={isDark ? "dark" : "light"}
      position="top-center"
      offset={56}
      duration={3000}
      richColors={false}
      swipeToDismissDirection="up"
      closeButton={false}
      gap={16}
      visibleToasts={5}
      toastOptions={toastOptions}
      icons={icons}
    />
  );
}

const iconWrap = StyleSheet.create({
  base: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
});
