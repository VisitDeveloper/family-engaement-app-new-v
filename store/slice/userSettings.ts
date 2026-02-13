import type { UserSettings } from "@/types";
import { StateCreator } from "zustand";

const DEFAULT_SETTINGS: Pick<
  UserSettings,
  "pushNotifications" | "emailNotifications" | "textMessages" | "urgentAlerts"
> = {
  pushNotifications: true,
  emailNotifications: true,
  textMessages: false,
  urgentAlerts: true,
};

export interface UserSettingsSlice {
  pushNotifications: boolean;
  emailNotifications: boolean;
  textMessages: boolean;
  urgentAlerts: boolean;
  setPushNotifications: (value: boolean) => void;
  setEmailNotifications: (value: boolean) => void;
  setTextMessages: (value: boolean) => void;
  setUrgentAlerts: (value: boolean) => void;
  /** Hydrate notification settings from profile (e.g. after GET /auth/profile) */
  setUserSettingsFromProfile: (settings: UserSettings | null | undefined) => void;
}

export const createUserSettingsSlice: StateCreator<
  any,
  [],
  [],
  UserSettingsSlice
> = (set) => ({
  ...DEFAULT_SETTINGS,

  setPushNotifications: (value) => set({ pushNotifications: value }),
  setEmailNotifications: (value) => set({ emailNotifications: value }),
  setTextMessages: (value) => set({ textMessages: value }),
  setUrgentAlerts: (value) => set({ urgentAlerts: value }),

  setUserSettingsFromProfile: (settings) => {
    if (!settings) {
      set(DEFAULT_SETTINGS);
      return;
    }
    set({
      pushNotifications: settings.pushNotifications ?? DEFAULT_SETTINGS.pushNotifications,
      emailNotifications: settings.emailNotifications ?? DEFAULT_SETTINGS.emailNotifications,
      textMessages: settings.textMessages ?? DEFAULT_SETTINGS.textMessages,
      urgentAlerts: settings.urgentAlerts ?? DEFAULT_SETTINGS.urgentAlerts,
    });
  },
});
