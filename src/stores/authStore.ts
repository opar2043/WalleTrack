import { create } from "zustand";
import * as AuthService from "@services/appwrite/auth";

interface AuthState {
  userId: string | null;
  email: string | null;
  name: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  isBiometricLocked: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  setBiometricLocked: (locked: boolean) => void;
  setUser: (userId: string, email: string, name: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  email: null,
  name: null,
  isLoggedIn: false,
  isLoading: false,
  isBiometricLocked: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const result = await AuthService.login(email, password);
      set({
        userId: result.userId,
        email: result.email,
        name: result.name ?? null,
        isLoggedIn: true,
        isLoading: false,
      });
      return true;
    } catch (error) {
      console.error("Login error:", error);
      set({ isLoading: false });
      return false;
    }
  },

  signup: async (name, email, password) => {
    set({ isLoading: true });
    try {
      const result = await AuthService.createAccount(email, password, name);
      set({
        userId: result.userId,
        email: result.email,
        name: result.name ?? null,
        isLoggedIn: true,
        isLoading: false,
      });
      return true;
    } catch (error) {
      console.error("Signup error:", error);
      set({ isLoading: false });
      return false;
    }
  },

  logout: async () => {
    try {
      await AuthService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
    set({
      userId: null,
      email: null,
      name: null,
      isLoggedIn: false,
    });
  },

  checkAuth: async () => {
    set({ isLoading: true });
    const user = await AuthService.getCurrentUser();
    if (user) {
      set({
        userId: user.userId,
        email: user.email,
        name: user.name ?? null,
        isLoggedIn: true,
        isLoading: false,
      });
      return true;
    }
    set({ isLoading: false, isLoggedIn: false });
    return false;
  },

  setBiometricLocked: (locked) =>
    set({ isBiometricLocked: locked }),

  setUser: (userId, email, name) =>
    set({ userId, email, name, isLoggedIn: true }),
}));
