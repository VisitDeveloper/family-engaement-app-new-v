import type { UserRole } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Appearance } from 'react-native';
import { ChatSlice, createChatSlice } from './slice/chat';
import { buildTheme, createThemeSlice, ThemeSlice } from './slice/highContrast';
import { createLanguageSlice, LanguageSlice } from './slice/language';
import { createLargeFontSlice, LargeFontSlice } from './slice/largeFont';
import { loginSliceStatus, LoginStatusSlice } from './slice/login';
import { createResourceSlice, ResourceSlice } from './slice/resource';
import { createUserSettingsSlice, UserSettingsSlice } from './slice/userSettings';
import { createVoiceNarrationSlice, VoiceNarrationSlice } from './slice/voiceNarration';

export interface StoreUser {
  id: string;
  name: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  phoneNumber?: string;
  phone?: string;
  profilePicture?: string;
  subjects?: string[];
  childName?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

interface UserSlice {
  user: StoreUser | null;
  setUser: (user: StoreUser | null) => void;
}

type StoreState = UserSlice & ChatSlice & ThemeSlice & LargeFontSlice & VoiceNarrationSlice & ResourceSlice & LoginStatusSlice & LanguageSlice & UserSettingsSlice;


// Combine multiple slices
export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // Main slice
      user: null,
      setUser: (user) => set({ user }),

      // Slice THeme
      ...createThemeSlice(set, get, {} as any),
      // Slice CHAT
      ...createChatSlice(set, get, {} as any),
      // Slice LARGE FONT
      ...createLargeFontSlice(set, get, {} as any),

      // Voice Narration Slice
      ...createVoiceNarrationSlice(set, get, {} as any),
      // Resource Slice 
      ...createResourceSlice(set, get, {} as any),
      // Language Slice
      ...createLanguageSlice(set, get, {} as any),
      // User settings (notification prefs from API)
      ...createUserSettingsSlice(set, get, {} as any),

      ...loginSliceStatus(set, get, {} as any)
    }),
    {
      name: 'main-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => {
        const { theme: _t, ...rest } = state;
        return rest;
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const scheme =
          state.userPreferredScheme ??
          state.colorScheme ??
          (Appearance.getColorScheme() ?? 'light');
        const isHC = state.isHighContrast ?? false;
        useStore.setState({
          colorScheme: scheme as 'light' | 'dark',
          theme: buildTheme(scheme as 'light' | 'dark', isHC),
        });
      },
    }
  )
);
