import { useStore } from "@/store/index";
import { Theme } from "@/store/slice/highContrast";
import { useMemo } from "react";
import { StyleSheet } from "react-native";

export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  creator: (theme: Theme) => T
): T {
  const theme = useStore(state => state.theme);
  return useMemo(() => StyleSheet.create(creator(theme)), [theme]);
}