import { databases } from "./client";
import { Query } from "react-native-appwrite";
import { APPWRITE_ENV } from "./client";
import type { FamilyGroup } from "@t/index";

export interface FamilyGroupDoc extends FamilyGroup {
  $id: string;
}

export async function getFamilyGroup(
  groupId: string
): Promise<FamilyGroupDoc | null> {
  try {
    const doc = await databases.getDocument(
      APPWRITE_ENV.databaseId,
      APPWRITE_ENV.collections.familyGroups,
      groupId
    );
    return {
      $id: doc.$id,
      ownerId: doc.ownerId,
      name: doc.name,
      memberIds: doc.memberIds ?? [],
      sharedAccountIds: doc.sharedAccountIds ?? [],
    };
  } catch (error) {
    console.error("Get family group error:", error);
    return null;
  }
}

export async function getFamilyGroupsForUser(
  userId: string
): Promise<FamilyGroupDoc[]> {
  try {
    const owned = await databases.listDocuments(
      APPWRITE_ENV.databaseId,
      APPWRITE_ENV.collections.familyGroups,
      [Query.equal("ownerId", userId), Query.limit(10)]
    );

    const result = await databases.listDocuments(
      APPWRITE_ENV.databaseId,
      APPWRITE_ENV.collections.familyGroups,
      [Query.search("memberIds", userId), Query.limit(10)]
    );

    const all = [...owned.documents, ...result.documents];
    return all.map((doc) => ({
      $id: doc.$id,
      ownerId: doc.ownerId,
      name: doc.name,
      memberIds: doc.memberIds ?? [],
      sharedAccountIds: doc.sharedAccountIds ?? [],
    }));
  } catch (error) {
    console.error("Get family groups error:", error);
    return [];
  }
}

export async function createFamilyGroup(
  ownerId: string,
  name: string,
  sharedAccountIds: string[]
): Promise<FamilyGroupDoc> {
  const result = await databases.createDocument(
    APPWRITE_ENV.databaseId,
    APPWRITE_ENV.collections.familyGroups,
    "unique()",
    {
      ownerId,
      name,
      memberIds: [ownerId],
      sharedAccountIds,
    }
  );

  return {
    $id: result.$id,
    ownerId: result.ownerId,
    name: result.name,
    memberIds: result.memberIds ?? [ownerId],
    sharedAccountIds: result.sharedAccountIds ?? [],
  };
}

export async function updateFamilyGroup(
  groupId: string,
  data: Partial<{
    name: string;
    memberIds: string[];
    sharedAccountIds: string[];
  }>
): Promise<void> {
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.memberIds !== undefined) updateData.memberIds = data.memberIds;
  if (data.sharedAccountIds !== undefined) updateData.sharedAccountIds = data.sharedAccountIds;

  await databases.updateDocument(
    APPWRITE_ENV.databaseId,
    APPWRITE_ENV.collections.familyGroups,
    groupId,
    updateData
  );
}

export async function inviteMember(
  groupId: string,
  memberId: string
): Promise<void> {
  const group = await getFamilyGroup(groupId);
  if (!group) return;

  const memberIds = group.memberIds.includes(memberId)
    ? group.memberIds
    : [...group.memberIds, memberId];

  await updateFamilyGroup(groupId, { memberIds });
}

export async function removeMember(
  groupId: string,
  memberId: string
): Promise<void> {
  const group = await getFamilyGroup(groupId);
  if (!group) return;

  const memberIds = group.memberIds.filter((id) => id !== memberId);
  await updateFamilyGroup(groupId, { memberIds });
}

export async function deleteFamilyGroup(groupId: string): Promise<void> {
  await databases.deleteDocument(
    APPWRITE_ENV.databaseId,
    APPWRITE_ENV.collections.familyGroups,
    groupId
  );
}
