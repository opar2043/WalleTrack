import { account } from "./client";
import type { Profile, ThemeMode } from "@t/index";
import { OAuthProvider } from "react-native-appwrite";
import {
  CACHE_KEYS,
  getItem,
  setItem,
  removeItem,
  clearAll,
} from "@services/storage";

export interface AuthResponse {
  userId: string;
  email: string;
  name?: string;
}

export async function createAccount(
  email: string,
  password: string,
  name: string
): Promise<AuthResponse> {
  const user = await account.create("unique()", email, password, name);
  await account.createEmailPasswordSession(email, password);
  return {
    userId: user.$id,
    email: user.email ?? email,
    name: user.name,
  };
}

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  await account.createEmailPasswordSession(email, password);
  const user = await account.get();
  return {
    userId: user.$id,
    email: user.email ?? email,
    name: user.name,
  };
}

export async function loginWithGoogle(): Promise<AuthResponse> {
  const user = await account.createOAuth2Token(
    OAuthProvider.Google,
    undefined,
    undefined,
    ["profile", "email"]
  );
  const session = await account.get();
  return {
    userId: session.$id,
    email: session.email ?? "",
    name: session.name,
  };
}

export async function logout(): Promise<void> {
  await account.deleteSession("current");
  clearAll();
}

export async function getCurrentUser(): Promise<AuthResponse | null> {
  try {
    const user = await account.get();
    return {
      userId: user.$id,
      email: user.email ?? "",
      name: user.name,
    };
  } catch {
    return null;
  }
}

export async function sendPasswordReset(email: string): Promise<void> {
  await account.createRecovery(email, "https://walletrack.app/reset-password");
}

export async function deleteAccount(userId: string): Promise<void> {
  try {
    await account.deleteSession("current");
    // Note: Fully deleting the Appwrite user record requires the server-side
    // Users API. We sign out locally and clear cached data here.
    clearAll();
  } catch (error) {
    console.error("Failed to delete account:", error);
    throw error;
  }
}

export async function getSession(): Promise<string | null> {
  try {
    const session = await account.getSession("current");
    return session.userId;
  } catch {
    return null;
  }
}
