/**
 * Session state.
 *
 * `zustand` holds the single source of truth for "who is signed in". The
 * opaque token itself lives in SecureStore and is never placed in React state,
 * so it cannot end up in a persisted store, a log line, or a dev-tools dump.
 */

import { create } from 'zustand';

import { authApi, usersApi } from '../api/endpoints';
import { clearSession, hydrateSession, saveSession } from '../api/storage';
import type { User } from '../types/api';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

type AuthState = {
  status: AuthStatus;
  user: User | null;
  error: string | null;
  isSubmitting: boolean;
  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  logoutEverywhere: () => Promise<void>;
  setUser: (user: User) => void;
  patchUser: (patch: Partial<User>) => void;
  clearLocalSession: () => Promise<void>;
  setError: (error: string | null) => void;
  setSubmitting: (submitting: boolean) => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'loading',
  user: null,
  error: null,
  isSubmitting: false,

  /** Restores a stored session on cold start, then loads the profile. */
  bootstrap: async () => {
    const { token } = await hydrateSession();
    if (!token) {
      set({ status: 'unauthenticated', user: null });
      return;
    }
    try {
      const user = await usersApi.me();
      set({ status: 'authenticated', user, error: null });
    } catch {
      // The stored session is expired or revoked: drop it and show sign-in.
      await clearSession();
      set({ status: 'unauthenticated', user: null });
    }
  },

  login: async (email, password) => {
    set({ isSubmitting: true, error: null });
    try {
      const result = await authApi.login({ email, password });
      await saveSession(result.token, result.expiresAt);
      set({ status: 'authenticated', user: result.user, isSubmitting: false });
    } catch (error) {
      set({
        isSubmitting: false,
        error: error instanceof Error ? error.message : 'Could not sign in.',
      });
      throw error;
    }
  },

  register: async (name, email, password) => {
    set({ isSubmitting: true, error: null });
    try {
      const result = await authApi.register({ name, email, password });
      await saveSession(result.token, result.expiresAt);
      set({ status: 'authenticated', user: result.user, isSubmitting: false });
    } catch (error) {
      set({
        isSubmitting: false,
        error: error instanceof Error ? error.message : 'Could not create the account.',
      });
      throw error;
    }
  },

  logout: async () => {
    // Hold the token in memory so the revocation call is still authenticated,
    // flip the UI first so it responds instantly, then wipe local storage.
    const { token } = await hydrateSession();
    set({ status: 'unauthenticated', user: null, error: null });
    try {
      if (token) await authApi.logout(token);
    } catch {
      // Best effort: the token is already invalid locally.
    } finally {
      await clearSession();
    }
  },

  logoutEverywhere: async () => {
    const { token } = await hydrateSession();
    set({ status: 'unauthenticated', user: null, error: null });
    try {
      if (token) await authApi.logoutAll(token);
    } catch {
      // Best effort.
    } finally {
      await clearSession();
    }
  },

  setUser: (user) => set({ user }),

  patchUser: (patch) => {
    const current = get().user;
    if (!current) return;
    set({ user: { ...current, ...patch } });
  },

  clearLocalSession: async () => {
    set({ status: 'unauthenticated', user: null, error: null });
    await clearSession();
  },

  setError: (error) => set({ error }),
  setSubmitting: (isSubmitting) => set({ isSubmitting }),
}));
