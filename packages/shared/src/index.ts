// ===== Channel =====
export interface Channel {
  id: string;
  name: string;
  avatar: string;
  userId: string;
}

export interface ChannelWithUser extends Channel {
  user: { id: string; name: string; username: string; image: string | null; bio: string | null };
  _count: { videos: number };
}

// ===== Video =====
export interface VideoBase {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: number;
  views: number;
  hlsUrl: string;
  qualities: string;
  tags: string;
  channelId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VideoWithChannel extends VideoBase {
  channel: Channel;
  likes?: Array<{ id: string; userId: string; videoId: string; type: string }>;
}

// ===== User =====
export interface SafeUser {
  id: string;
  name: string | null;
  username: string;
  email: string | null;
  image: string | null;
  role: string;
  bio: string | null;
  createdAt: string;
}

// ===== Queue Jobs =====
export interface VideoProcessingJob {
  videoId: string;
  inputPath: string;
}

export interface VideoProcessingResult {
  videoId: string;
  qualities: Record<string, string>;
  hlsUrl: string;
}

// ===== Payment =====
export interface PaymentSessionResult {
  url: string | null;
  sessionId?: string;
}

export interface MaxelPayWebhookPayload {
  event: string;
  data?: {
    orderId?: string;
    status?: string;
    amount?: number;
    currency?: string;
  };
  timestamp?: string;
}

// ===== API Responses =====
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  nextCursor?: string | null;
}

export interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}

export interface HealthCheckResponse {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  checks: Record<string, string>;
}

// ===== Constants =====
export const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/x-msvideo",
  "video/quicktime",
] as const;

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const MAX_VIDEO_SIZE = 500 * 1024 * 1024;
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
export const MAX_COMMENT_LENGTH = 1000;
export const DEFAULT_PAGE_LIMIT = 12;
export const MAX_PAGE_LIMIT = 50;
