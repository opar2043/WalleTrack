import { DEMO_PROFILE } from "../../data";
import type { Profile } from "@t/index";

export interface ProfileDoc extends Profile {
  $id: string;
}

// In-memory store so profile edits reflect immediately in the UI during the
// demo session. Resets to the seed data on app restart.
let store: ProfileDoc | null = {
  $id: "profile_demo",
  userId: DEMO_PROFILE.userId,
  fullName: DEMO_PROFILE.fullName,
  avatarFileId: DEMO_PROFILE.avatarFileId,
  nationality: DEMO_PROFILE.nationality,
  baseCurrency: DEMO_PROFILE.baseCurrency,
  language: DEMO_PROFILE.language,
  theme: DEMO_PROFILE.theme as Profile["theme"],
  biometricEnabled: DEMO_PROFILE.biometricEnabled,
  isPremium: DEMO_PROFILE.isPremium,
  familyGroupId: DEMO_PROFILE.familyGroupId,
};

export async function getProfile(userId: string): Promise<ProfileDoc | null> {
  if (!store) return null;
  return {
    ...store,
    theme: (store.theme as Profile["theme"]) || "system",
    biometricEnabled: store.biometricEnabled ?? false,
    isPremium: store.isPremium ?? false,
  };
}

export async function upsertProfile(
  userId: string,
  data: Partial<Profile>
): Promise<void> {
  store = {
    $id: store?.$id ?? "profile_demo",
    userId: store?.userId ?? userId,
    fullName: data.fullName ?? store?.fullName ?? "",
    avatarFileId: data.avatarFileId ?? store?.avatarFileId ?? "",
    nationality: data.nationality ?? store?.nationality ?? "US",
    baseCurrency: data.baseCurrency ?? store?.baseCurrency ?? "USD",
    language: data.language ?? store?.language ?? "en",
    theme: (data.theme as Profile["theme"]) ?? store?.theme ?? "system",
    biometricEnabled: data.biometricEnabled ?? store?.biometricEnabled ?? false,
    isPremium: data.isPremium ?? store?.isPremium ?? false,
    familyGroupId: data.familyGroupId ?? store?.familyGroupId ?? "",
  };
}