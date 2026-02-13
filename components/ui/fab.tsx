import { useStore } from "@/store";
import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const FAB_SIZE = 56;
const FAB_MARGIN = 16;
const FAB_ELEVATION = 6;

interface FABProps {
  /** Route to navigate on press (e.g. /new-resource, /new-message) */
  href: string;
  /** Icon to show (e.g. NewIcon). Use size 24 for FAB. */
  icon: React.ReactNode;
  /** Optional accessibility label */
  accessibilityLabel?: string;
}

/**
 * Material Design 3 Floating Action Button.
 * Use on Android for primary "new" actions; position bottom-right with safe area.
 */
export function FAB({ href, icon, accessibilityLabel = "Add" }: FABProps) {
  const router = useRouter();
  const theme = useStore((state) => state.theme);
  const insets = useSafeAreaInsets();

  // Lower position: just above tab bar (tab bar ~56–60pt content)
  const bottom = insets.bottom;
  const right = FAB_MARGIN;

  return (
    <View
      style={[
        styles.wrapper,
        {
          bottom,
          right,
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.fabOuter}>
        <Pressable
          onPress={() => router.push(href as any)}
          style={({ pressed }) => [
            styles.fab,
            {
              backgroundColor: theme.tint,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={`Double tap to ${accessibilityLabel.toLowerCase()}`}
        >
          <View style={styles.iconWrap}>{icon}</View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    zIndex: 100,
  },
  fabOuter: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: 12,
    overflow: "hidden",
    ...Platform.select({
      android: {
        elevation: FAB_ELEVATION,
      },
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
    }),
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  iconWrap: {
    justifyContent: "center",
    alignItems: "center",
  },
});
