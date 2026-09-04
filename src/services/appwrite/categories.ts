import { databases } from "./client";
import { Query } from "react-native-appwrite";
import { APPWRITE_ENV } from "./client";
import type { Category, CategoryType } from "@t/index";

export interface CategoryDoc extends Category {
  $id: string;
}

export async function getCategories(
  userId: string
): Promise<CategoryDoc[]> {
  try {
    const systemResult = await databases.listDocuments(
      APPWRITE_ENV.databaseId,
      APPWRITE_ENV.collections.categories,
      [
        Query.equal("userId", ""),
        Query.limit(100),
      ]
    );

    const userResult = await databases.listDocuments(
      APPWRITE_ENV.databaseId,
      APPWRITE_ENV.collections.categories,
      [
        Query.equal("userId", userId),
        Query.limit(100),
      ]
    );

    const allDocs = [...systemResult.documents, ...userResult.documents];
    return allDocs.map((doc) => ({
      $id: doc.$id,
      userId: doc.userId,
      name: doc.name,
      icon: doc.icon,
      color: doc.color,
      type: doc.type as CategoryType,
    }));
  } catch (error) {
    console.error("Get categories error:", error);
    return [];
  }
}

export async function createCategory(
  userId: string,
  data: {
    name: string;
    icon: string;
    color: string;
    type: CategoryType;
  }
): Promise<CategoryDoc> {
  const result = await databases.createDocument(
    APPWRITE_ENV.databaseId,
    APPWRITE_ENV.collections.categories,
    "unique()",
    {
      userId,
      name: data.name,
      icon: data.icon,
      color: data.color,
      type: data.type,
    }
  );

  return {
    $id: result.$id,
    userId: result.userId,
    name: result.name,
    icon: result.icon,
    color: result.color,
    type: result.type as CategoryType,
  };
}

export async function updateCategory(
  categoryId: string,
  data: Partial<{
    name: string;
    icon: string;
    color: string;
    type: CategoryType;
  }>
): Promise<void> {
  await databases.updateDocument(
    APPWRITE_ENV.databaseId,
    APPWRITE_ENV.collections.categories,
    categoryId,
    data
  );
}

export async function deleteCategory(categoryId: string): Promise<void> {
  await databases.deleteDocument(
    APPWRITE_ENV.databaseId,
    APPWRITE_ENV.collections.categories,
    categoryId
  );
}
