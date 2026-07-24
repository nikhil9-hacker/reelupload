export interface InstagramAccount {
  id: string;
  username: string;
  fullName: string;
  profilePictureUrl?: string;
  isConnected: boolean;
  followersCount?: number;
}

export interface GoogleDriveStatus {
  isConnected: boolean;
  email?: string;
  selectedFolderId?: string;
  selectedFolderName?: string;
}

export interface WorkerStatus {
  isActive: boolean;
  lastRun?: string;
  nextRun?: string;
}

export interface Reel {
  id: string;
  title: string;
  videoPath: string; // e.g. "Google Drive: Reels/video.mp4"
  textPath?: string; // e.g. "Google Drive: Reels/video.txt"
  caption?: string;
  scheduledTime?: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  fileSize?: string;
  thumbnailUrl?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  module: 'system' | 'instagram' | 'drive' | 'worker';
}

export interface StatItem {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: string;
}

export interface SetupStep {
  id: number;
  title: string;
  description: string;
  isCompleted: boolean;
}
