export const APP_STATUSES = ["live", "building", "paused"] as const;
export type AppStatus = (typeof APP_STATUSES)[number];

export const VIBE_TOOLS = [
  "codex",
  "claude-code",
  "gemini",
  "lovable",
  "bolt",
  "replit",
  "v0",
  "base44",
  "cursor",
  "firebase-studio",
  "other",
] as const;
export type VibeTool = (typeof VIBE_TOOLS)[number];

/** Whether the app's own URL still answers. Probed in the background. */
export type AppHealth = "ok" | "unreachable";

export interface VibeApp {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  url: string | null;
  imageURL: string | null;
  faviconURL: string | null;
  tool: VibeTool;
  customToolName: string | null;
  status: AppStatus;
  isFirstApp: boolean;
  isPublished: boolean;
  sortOrder: number;
  health: AppHealth;
  healthCheckedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicVibeApp {
  id: string;
  name: string;
  description: string;
  url: string | null;
  imageURL: string | null;
  faviconURL: string | null;
  tool: VibeTool;
  customToolName: string | null;
  status: AppStatus;
  isFirstApp: boolean;
  sortOrder: number;
  health: AppHealth;
  outboundClicks: number;
  cheers: number;
}

export interface CreateAppInput {
  name: string;
  description: string;
  url: string | null;
  imageURL?: string | null;
  faviconURL?: string | null;
  tool: VibeTool;
  customToolName?: string | null;
  status: AppStatus;
  isPublished?: boolean;
}

export interface UpdateAppInput {
  name?: string;
  description?: string;
  url?: string | null;
  imageURL?: string | null;
  faviconURL?: string | null;
  tool?: VibeTool;
  customToolName?: string | null;
  status?: AppStatus;
  isPublished?: boolean;
}

/** A recently published app, shown in the maker directory timeline. */
export interface RecentPublicApp {
  id: string;
  name: string;
  description: string;
  url: string | null;
  imageURL: string | null;
  faviconURL: string | null;
  tool: VibeTool;
  customToolName: string | null;
  status: AppStatus;
  createdAt: string;
  ownerUsername: string;
  ownerDisplayName: string;
  ownerPhotoURL: string | null;
}
