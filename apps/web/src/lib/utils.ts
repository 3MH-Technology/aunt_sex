import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatViews(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toString();
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function timeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
  if (diffInSeconds < 60) return "الآن";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} دقيقة`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ساعة`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} يوم`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} شهر`;
  return `${Math.floor(diffInSeconds / 31536000)} سنة`;
}
