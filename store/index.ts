import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { ChatSlice, createChatSlice } from './slice/chat';
import { createThemeSlice, ThemeSlice } from './slice/highContrast';
import { createLargeFontSlice, LargeFontSlice } from './slice/largeFont';
import { createResourceSlice, ResourceSlice } from './slice/resource';
import { createVoiceNarrationSlice, VoiceNarrationSlice } from './slice/voiceNarration';


interface UserSlice {
  user: { id: string; name: string } | null;
  setUser: (user: { id: string; name: string }) => void;
}

type StoreState = UserSlice & ChatSlice & ThemeSlice & LargeFontSlice & VoiceNarrationSlice & ResourceSlice;


// ترکیب چند slice
export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // Slice اصلی
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
    }),
    {
      name: 'main-store',
      storage: createJSONStorage(() => AsyncStorage), // ← اینجا مهمه
    }
  )
);
