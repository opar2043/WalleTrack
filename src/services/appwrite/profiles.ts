import { databases } from "./client";
import type { Profile } from "@t/index";
import { Query } from "react-native-appwrite";
import { APPWRITE_ENV } from "./client";

export interface ProfileDoc extends Profile {
  $id: string;
}

export async function getProfile(userId: string): Promise<ProfileDoc | null> {
  try {
    const result = await databases.listDocuments(
      APPWRITE_ENV.databaseId,
      APPWRITE_ENV.collections.profiles,
      [Query.equal("userId", userId), Query.limit(1)]
    );

    if (result.documents.length === 0) return null;
    const doc = result.documents[0];
    return {
      $id: doc.$id,
      userId: doc.userId,
      fullName: doc.fullName,
      avatarFileId: doc.avatarFileId,
      nationality: doc.nationality,
      baseCurrency: doc.baseCurrency,
      language: doc.language,
      theme: (doc.theme as Profile["theme"]) || "system",
      biometricEnabled: doc.biometricEnabled ?? false,
      isPremium: doc.isPremium ?? false,
      familyGroupId: doc.familyGroupId,
    };
  } catch (error) {
    console.error("Get profile error:", error);
    return null;
  }
}

export async function upsertProfile(
  userId: string,
  data: Partial<Profile>
): Promise<void> {
  const existing = await getProfile(userId);

  if (!existing) {
    await databases.createDocument(
      APPWRITE_ENV.databaseId,
      APPWRITE_ENV.collections.profiles,
      "unique()",
      {
        userId,
        fullName: data.fullName ?? "",
        avatarFileId: data.avatarFileId ?? "",
        nationality: data.nationality ?? "",
        baseCurrency: data.baseCurrency ?? "USD",
        language: data.language ?? "en",
        theme: data.theme ?? "system",
        biometricEnabled: data.biometricEnabled ?? false,
        isPremium: data.isPremium ?? false,
        familyGroupId: data.familyGroupId ?? "",
      }
    );
    return;
  }

  await databases.updateDocument(
    APPWRITE_ENV.databaseId,
    APPWRITE_ENV.collections.profiles,
    existing.$id,
    {
      fullName: data.fullName,
      avatarFileId: data.avatarFileId,
      nationality: data.nationality,
      baseCurrency: data.baseCurrency,
      language: data.language,
      theme: data.theme,
      biometricEnabled: data.biometricEnabled,
      isPremium: data.isPremium,
      familyGroupId: data.familyGroupId,
    }
  );
}
