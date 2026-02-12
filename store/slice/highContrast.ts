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

/** When undefined, app follows device theme; otherwise use this. */
export type UserPreferredScheme = "light" | "dark" | undefined;

export interface ThemeSlice {
  colorScheme: "light" | "dark";
  /** User choice; undefined = follow device. */
  userPreferredScheme: UserPreferredScheme;
  isHighContrast: boolean;
  theme: Theme;
  setColorScheme: (scheme: "light" | "dark") => void;
  toggleHighContrast: () => void;
}

function getSystemScheme(): "light" | "dark" {
  return (Appearance.getColorScheme() ?? "light") as "light" | "dark";
}

export const createThemeSlice: StateCreator<any, [], [], ThemeSlice> = (set, get) => {
  const systemScheme = getSystemScheme();

  const listener = () => {
    const { userPreferredScheme, isHighContrast } = get();
    if (userPreferredScheme !== undefined) return;
    const scheme = getSystemScheme();
    set({ colorScheme: scheme, theme: buildTheme(scheme, isHighContrast) });
  };
  Appearance.addChangeListener(listener);

  return {
    colorScheme: systemScheme,
    userPreferredScheme: undefined,
    isHighContrast: false,
    theme: buildTheme(systemScheme, false),

    setColorScheme: (scheme) => {
      const { isHighContrast } = get();
      set({
        userPreferredScheme: scheme,
        colorScheme: scheme,
        theme: buildTheme(scheme, isHighContrast),
      });
    },

    toggleHighContrast: () => {
      const { colorScheme, isHighContrast } = get();
      set({
        isHighContrast: !isHighContrast,
        theme: buildTheme(colorScheme, !isHighContrast),
      });
    },
  };
};

export function buildTheme(colorScheme: "light" | "dark", isHighContrast: boolean): Theme {
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

