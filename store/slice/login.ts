import { StateCreator } from "zustand";
import type { UserRole } from "@/types";

export type Role = UserRole | null;

export interface LoginStatusSlice {
    isLoggedIn: boolean;
    setLoggedIn: (value: boolean) => void;
    role: Role;
    setRole: (value: Role) => void;
}


export const loginSliceStatus: StateCreator<any, [], [], LoginStatusSlice> = ((set) => ({
    isLoggedIn: false,
    setLoggedIn: (value: boolean) => set({ isLoggedIn: value }),
    role: null,
    setRole: (role) => set({ role }),
}));