import { Client, Account, Databases, Storage, Functions } from "react-native-appwrite";
import {
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID,
  APPWRITE_DATABASE_ID,
  APPWRITE_ACCOUNTS_COLLECTION_ID,
  APPWRITE_CATEGORIES_COLLECTION_ID,
  APPWRITE_TRANSACTIONS_COLLECTION_ID,
  APPWRITE_RECURRING_RULES_COLLECTION_ID,
  APPWRITE_BUDGETS_COLLECTION_ID,
  APPWRITE_PROFILES_COLLECTION_ID,
  APPWRITE_FAMILY_GROUPS_COLLECTION_ID,
  APPWRITE_RECEIPTS_BUCKET_ID,
  APPWRITE_AVATARS_BUCKET_ID,
} from "@env";

export const APPWRITE_ENV = {
  endpoint: APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1",
  projectId: APPWRITE_PROJECT_ID || "",
  databaseId: APPWRITE_DATABASE_ID || "finance_db",
  collections: {
    profiles: APPWRITE_PROFILES_COLLECTION_ID || "profiles",
    accounts: APPWRITE_ACCOUNTS_COLLECTION_ID || "accounts",
    categories: APPWRITE_CATEGORIES_COLLECTION_ID || "categories",
    transactions: APPWRITE_TRANSACTIONS_COLLECTION_ID || "transactions",
    recurringRules: APPWRITE_RECURRING_RULES_COLLECTION_ID || "recurring_rules",
    budgets: APPWRITE_BUDGETS_COLLECTION_ID || "budgets",
    familyGroups: APPWRITE_FAMILY_GROUPS_COLLECTION_ID || "family_groups",
  },
  buckets: {
    receipts: APPWRITE_RECEIPTS_BUCKET_ID || "receipts",
    avatars: APPWRITE_AVATARS_BUCKET_ID || "avatars",
  },
} as const;

const client = new Client()
  .setEndpoint(APPWRITE_ENV.endpoint)
  .setProject(APPWRITE_ENV.projectId)
  .setPlatform("com.walletrack.app");

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);

export default client;
