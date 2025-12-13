import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { ChatSlice, createChatSlice } from './slice/chat';
import { createThemeSlice, ThemeSlice } from './slice/highContrast';
import { createLargeFontSlice, LargeFontSlice } from './slice/largeFont';
import { loginSliceStatus, LoginStatusSlice } from './slice/login';
import { createResourceSlice, ResourceSlice } from './slice/resource';
import { createVoiceNarrationSlice, VoiceNarrationSlice } from './slice/voiceNarration';


interface UserSlice {
  user: { 
    id: string; 
    name: string;
    email?: string;
    role?: 'admin' | 'teacher' | 'parent';
    avatar?: string;
    [key: string]: any; // برای فیلدهای اضافی که ممکن است از API بیایند
  } | null;
  setUser: (user: { 
    id: string; 
    name: string;
    email?: string;
    role?: 'admin' | 'teacher' | 'parent';
    avatar?: string;
    [key: string]: any;
  } | null) => void;
}

type StoreState = UserSlice & ChatSlice & ThemeSlice & LargeFontSlice & VoiceNarrationSlice & ResourceSlice & LoginStatusSlice;


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

      ...loginSliceStatus(set, get, {} as any)
    }),
    {
      name: 'main-store',
      storage: createJSONStorage(() => AsyncStorage), // ← اینجا مهمه
    }
  )
);
