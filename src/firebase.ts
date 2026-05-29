import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Read environment variables safely
const env = (import.meta as any).env || {};
const apiKey = env.VITE_FIREBASE_API_KEY;
const authDomain = env.VITE_FIREBASE_AUTH_DOMAIN;
const projectId = env.VITE_FIREBASE_PROJECT_ID;
const storageBucket = env.VITE_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = env.VITE_FIREBASE_MESSAGING_SENDER_ID;
const appId = env.VITE_FIREBASE_APP_ID;
const databaseId = env.VITE_FIREBASE_DATABASE_ID;


// Detect if custom environmental config is provided
const isEnvConfigured = !!apiKey;

const firebaseConfig = {
  apiKey: apiKey,
authDomain: authDomain,
projectId: projectId,
storageBucket: storageBucket,
messagingSenderId: messagingSenderId,
appId: appId,
};

// Set correct database instance ID
const firestoreDatabaseId = databaseId || (isEnvConfigured ? "(default)" : "ai-studio-01903b2c-0889-4ea1-b6ef-a0d897b0306e");

// Initialize Firebase App safely ensuring no duplication errors
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Export db with correct database instance
export const db = getFirestore(app, firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Authentication & Firestore error handling wrapper
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
