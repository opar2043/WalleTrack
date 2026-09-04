import { create } from "zustand";
import type { Profile, ThemeMode } from "@t/index";
import { getProfile, upsertProfile } from "@services/appwrite/profiles";
import { CACHE_KEYS, setString } from "@services/storage";

interface ProfileState {
  profile: Profile | null;
  isLoading: boolean;
  loadProfile: (userId: string) => Promise<void>;
  setProfile: (data: Partial<Profile>) => void;
  syncProfile: (userId: string) => Promise<void>;
  setTheme: (theme: ThemeMode) => void;
  setBiometric: (enabled: boolean) => void;
  setPremium: (isPremium: boolean) => void;
  resetProfile: () => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  isLoading: false,

  loadProfile: async (userId) => {
    set({ isLoading: true });
    const profile = await getProfile(userId);
    if (profile) {
      set({
        profile: {
          userId: profile.userId,
          fullName: profile.fullName,
          avatarFileId: profile.avatarFileId,
          nationality: profile.nationality,
          baseCurrency: profile.baseCurrency,
          language: profile.language,
          theme: profile.theme,
          biometricEnabled: profile.biometricEnabled,
          isPremium: profile.isPremium,
          familyGroupId: profile.familyGroupId,
        },
        isLoading: false,
      });
    } else {
      set({ isLoading: false });
    }
  },

  setProfile: (data) => {
    const current = get().profile;
    set({
      profile: current ? { ...current, ...data } : (data as Profile),
    });
  },

  syncProfile: async (userId) => {
    const { profile } = get();
    if (!profile) return;
    await upsertProfile(userId, profile);
  },

  setTheme: (theme) => {
    set((state) => ({
      profile: state.profile
        ? { ...state.profile, theme }
        : ({
            userId: "",
            fullName: "",
            theme,
            biometricEnabled: false,
            isPremium: false,
          } as Profile),
    }));
    setString(CACHE_KEYS.THEME, theme);
  },

  setBiometric: (enabled) => {
    set((state) => ({
      profile: state.profile
        ? { ...state.profile, biometricEnabled: enabled }
        : ({
            userId: "",
            fullName: "",
            theme: "system",
            biometricEnabled: enabled,
            isPremium: false,
          } as Profile),
    }));
  },

  setPremium: (isPremium) => {
    set((state) => ({
      profile: state.profile
        ? { ...state.profile, isPremium }
        : ({
            userId: "",
            fullName: "",
            theme: "system",
            biometricEnabled: false,
            isPremium,
          } as Profile),
    }));
  },

  resetProfile: () => set({ profile: null }),
}));
