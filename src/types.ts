export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  avatar: string;
  subscriptionPlan: "Free" | "Pro IV" | "Pro V";
  academicUsageCount: number;
  nonAcademicUsageCount: number;
  lastUsageReset: string; // ISO DateTime string
  createdAt: string; // ISO DateTime string
}

export interface ChatSession {
  id: string;
  title: string;
  mode: "academic" | "non-academic";
  createdAt: string; // ISO DateTime string
  updatedAt: string; // ISO DateTime */
  isPinned?: boolean;
}

export interface ChatAttachment {
  name: string;
  type: string; // e.g., "image/jpeg", "application/pdf", etc.
  size: number;
  url: string; // Base64 data URL or URL string
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string; // ISO DateTime */
  attachments?: ChatAttachment[];
}

export type SubscriptionPlan = "Free" | "Pro IV" | "Pro V";
