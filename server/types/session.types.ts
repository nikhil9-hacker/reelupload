export interface IUserSession {
  userId: string;
  instagramConnected: boolean;
  googleDriveConnected: boolean;
  googleConnected: boolean;
  workspaceId: string;
  sessionCreatedTime: number;
  onboardingFinished?: boolean;
  tempInstagram?: {
    id: string;
    username: string;
    fullName: string;
    profilePictureUrl?: string;
    facebookPageId: string;
    facebookPageName: string;
    longLivedToken: string;
    expiresAt: Date;
  };
  tempGoogle?: {
    email: string;
    googleUserId: string;
    googleAccessToken: string;
    googleRefreshToken: string | null;
    googleTokenExpiry: Date;
    folderId?: string;
    folderName?: string;
  };
}
