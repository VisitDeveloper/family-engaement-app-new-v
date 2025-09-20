// store/largeFontSlice.ts
import { StateCreator } from "zustand";

export interface LargeFontSlice {
  isLargeFont: boolean;
  toggleLargeFont: () => void;
  setLargeFont: (value: boolean) => void;
}

export const createLargeFontSlice: StateCreator<any, [], [], LargeFontSlice> = (set) => ({
  isLargeFont: false,

  toggleLargeFont: () => set((state:any) => ({ isLargeFont: !state.isLargeFont })),
  setLargeFont: (value: boolean) => set({ isLargeFont: value }),
});