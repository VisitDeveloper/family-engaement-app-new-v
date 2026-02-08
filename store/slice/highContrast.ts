import { Colors } from "@/constants/theme";
import { Appearance } from "react-native";
import { StateCreator } from "zustand";

export interface Theme {
  bg: string;
  text: string;
  subText: string;
  panel: string;
  border: string;
  tint: string;
  passDesc: string;
  iconDash: string;
  emergencyColor: string;
  emergencyBackground: string;
  star: string;
}

export interface ThemeSlice {
  colorScheme: "light" | "dark";
  isHighContrast: boolean;
  theme: Theme;
  setColorScheme: (scheme: "light" | "dark") => void;
  toggleHighContrast: () => void;
}

export const createThemeSlice: StateCreator<any, [], [], ThemeSlice> = (set, get) => {
  const listener = (preferences: { colorScheme: any }) => {
    const scheme = preferences.colorScheme ?? "light"; // If null, consider light
    const { isHighContrast } = get();
    set({ colorScheme: scheme, theme: buildTheme(scheme, isHighContrast) });
  };

  Appearance.addChangeListener(listener);

  return {
    colorScheme: Appearance.getColorScheme() as 'light' | 'dark',
    isHighContrast: false,

    theme: buildTheme(Appearance.getColorScheme() as 'light' | 'dark', false),


    setColorScheme: (scheme) => {
      const { isHighContrast } = get();
      set({ colorScheme: scheme, theme: buildTheme(scheme, isHighContrast) });
    },

    toggleHighContrast: () => {
      const { colorScheme, isHighContrast } = get();
      set({
        isHighContrast: !isHighContrast,
        theme: buildTheme(colorScheme, !isHighContrast),
      });
    },
  }
}

// helper
function buildTheme(colorScheme: "light" | "dark", isHighContrast: boolean): Theme {
  const baseTheme = colorScheme === "dark" ? Colors.dark : Colors.light;
  return {
    bg: isHighContrast ? "#000" : baseTheme.background,
    text: isHighContrast ? "#fff" : baseTheme.text,
    subText: isHighContrast ? "#fff" : baseTheme.textSecondary,
    panel: isHighContrast ? "#111" : baseTheme.backgroundElementSecondary,
    border: isHighContrast ? "#fff" : baseTheme.borderColor,
    tint: isHighContrast ? "#d17fe0" : baseTheme.tint,
    passDesc: isHighContrast ? "#4CAF50" : baseTheme.passwordDescriptionText,
    iconDash: isHighContrast ? "#fff" : baseTheme.dashboardColorNumber,
    emergencyColor: isHighContrast ? "#f87171" : baseTheme.emergencyColor,
    emergencyBackground: isHighContrast ? "#f87171" : baseTheme.emergencyBackground,
    star: isHighContrast ? "#efb000" : baseTheme.star
  };
}

