// Type definitions only — no mock data
export interface Reel {
  id: string;
  videoName: string;
  caption: string;
  scheduledAt: string;
  // Legacy fields used by ScheduleDrawer (kept for compatibility)
  scheduledDate?: string;
  scheduledTime?: string;
  hashtags?: string[];
  mentions?: string[];
  thumbnail?: string;
  duration?: string;
  fileSize?: string;
  filePath?: string;
  failureReason?: string;
  views?: number;
  likes?: number;
  comments?: number;
  timezone: string;
  status: 'PENDING' | 'PROCESSING' | 'PUBLISHED' | 'FAILED' | 'CANCELLED' | 'PAUSED';
  driveFileId: string;
  instagramMediaId?: string;
  errorLog?: string;
  retries: number;
  publishedAt?: string;
  createdAt: string;
}


export const TIMEZONES = [
  { value: 'UTC', label: 'UTC — Coordinated Universal Time' },
  { value: 'America/New_York', label: 'Eastern Time (ET) — New York' },
  { value: 'America/Chicago', label: 'Central Time (CT) — Chicago' },
  { value: 'America/Denver', label: 'Mountain Time (MT) — Denver' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT) — Los Angeles' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT) — London' },
  { value: 'Europe/Paris', label: 'Central European Time (CET) — Paris' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST) — Mumbai' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST) — Tokyo' },
  { value: 'Asia/Singapore', label: 'Singapore Standard Time (SGT) — Singapore' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (AEST) — Sydney' },
];
