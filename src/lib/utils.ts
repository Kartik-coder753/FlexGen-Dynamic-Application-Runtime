import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { auth, db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | number | Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
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
  }
}

export function sanitizeData(data: any): any {
  const sanitized: any = {};
  Object.keys(data).forEach((key) => {
    if (data[key] !== undefined) {
      sanitized[key] = data[key];
    }
  });
  return sanitized;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const technicalError = error instanceof Error ? error.message : String(error);
  
  // Map common Firebase errors to user-friendly messages
  let userFriendlyMessage = "An unexpected database synchronization error occurred. Please refresh and try again.";
  
  if (technicalError.includes('permission-denied')) {
    userFriendlyMessage = "Access Denied: You do not have the required permissions to perform this operation on the selected resource cluster.";
  } else if (technicalError.includes('quota-exceeded')) {
    userFriendlyMessage = "System Overflow: Operational quotas have been exceeded. High-availability mode will restore shortly.";
  } else if (technicalError.includes('too-many-requests')) {
    userFriendlyMessage = "Traffic Spike: Too many requests detected. Throttling active to maintain core stability.";
  } else if (technicalError.includes('offline')) {
    userFriendlyMessage = "Link Severed: Your terminal is currently offline. Local changes will be re-synchronized once the connection is restored.";
  }

  const errInfo: FirestoreErrorInfo = {
    error: technicalError,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  
  // Log to console for development
  console.error('Firestore Error Payload:', errInfo);

  // Background log to database if authenticated and not already dealing with a log error
  if (auth.currentUser && path !== 'content/logs') {
    addDoc(collection(db, "content"), {
      entityType: "logs",
      data: {
        severity: "CRITICAL",
        message: technicalError,
        op: operationType,
        target: path,
        timestamp: Date.now()
      },
      ownerId: auth.currentUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }).catch(e => console.warn('Failed to commit remote diagnostic log:', e));
  }

  // We throw a more descriptive error that the UI can catch
  const finalError = new Error(userFriendlyMessage);
  (finalError as any).diagnostics = errInfo;
  throw finalError;
}
