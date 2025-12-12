import { StateCreator } from "zustand";


type Role = 'admin' | 'teacher' | 'parent' | null;

export interface LoginStatusSlice {
    isLoggedIn: boolean;
    setLoggedIn: (value: boolean) => void;
    role: Role,
    setRole: (value: Role) => void,
}


export const loginSliceStatus: StateCreator<any, [], [], LoginStatusSlice> = ((set) => ({
    isLoggedIn: false,
    setLoggedIn: (value: boolean) => set({ isLoggedIn: value }),
    role: null,
    setRole: (role) => set({ role }),
}));