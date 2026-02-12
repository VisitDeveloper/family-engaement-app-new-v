import { useStore } from "@/store";

/** Returns the app's color scheme (from Settings), not the device's. */
export function useColorScheme(): "light" | "dark" {
  return useStore((state) => state.colorScheme) ?? "light";
}
