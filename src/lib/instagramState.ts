import { InstagramAccount } from '../types';

const STORAGE_KEY = 'reelpilot_instagram_account';

export interface ExtendedInstagramAccount extends InstagramAccount {
  facebookPage?: string;
  connectedAt?: string;
  metaAppId?: string;
}

/**
 * Retrieves the currently connected Instagram account from localStorage.
 */
export function getInstagramAccount(): ExtendedInstagramAccount | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data) as ExtendedInstagramAccount;
  } catch (error) {
    console.error('Failed to parse Instagram account state:', error);
    return null;
  }
}

/**
 * Saves the Instagram account state to localStorage.
 */
export function saveInstagramAccount(account: ExtendedInstagramAccount | null): void {
  try {
    if (account) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(account));
      window.dispatchEvent(new Event('instagram-account-changed'));
    } else {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new Event('instagram-account-changed'));
    }
  } catch (error) {
    console.error('Failed to save Instagram account state:', error);
  }
}
