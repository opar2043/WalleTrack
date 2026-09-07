import {
  DEMO_USER,
  DEMO_EMAIL,
  DEMO_PASSWORD,
} from "../../data";
import {
  getItem,
  setItem,
  removeItem,
  clearAll,
} from "@services/storage";

// Local-only mock session. Set once the user logs in / signs up so that
// checkAuth() can restore the session after an app restart.
const SESSION_KEY = "@demo_session";

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
  if (email.trim().toLowerCase() !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
    throw new Error("Invalid demo credentials. Use demo@gmail.com / 12345678");
  }

  const user = {
    userId: DEMO_USER.userId,
    email: DEMO_EMAIL,
    name: name.trim() || DEMO_USER.name,
  };

  setItem(SESSION_KEY, { email: user.email, name: user.name });
  return user;
}

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  if (email.trim().toLowerCase() !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
    throw new Error("Invalid demo credentials. Use demo@gmail.com / 12345678");
  }

  const saved = getItem<{ name?: string }>(SESSION_KEY);
  const user: AuthResponse = {
    userId: DEMO_USER.userId,
    email: DEMO_EMAIL,
    name: saved?.name || DEMO_USER.name,
  };

  setItem(SESSION_KEY, { email: user.email, name: user.name });
  return user;
}

export async function loginWithGoogle(): Promise<AuthResponse> {
  return login(DEMO_EMAIL, DEMO_PASSWORD);
}

export async function logout(): Promise<void> {
  removeItem(SESSION_KEY);
  clearAll();
}

export async function getCurrentUser(): Promise<AuthResponse | null> {
  try {
    const session = getItem<{ email: string; name?: string }>(SESSION_KEY);
    if (!session) return null;
    return {
      userId: DEMO_USER.userId,
      email: session.email || DEMO_EMAIL,
      name: session.name || DEMO_USER.name,
    };
  } catch {
    return null;
  }
}

export async function sendPasswordReset(email: string): Promise<void> {
  // No-op mock. Accept any valid email in the demo.
  return Promise.resolve();
}

export async function deleteAccount(userId: string): Promise<void> {
  removeItem(SESSION_KEY);
  clearAll();
}

export async function getSession(): Promise<string | null> {
  const session = getItem<{ email: string }>(SESSION_KEY);
  return session ? DEMO_USER.userId : null;
}