import { Platform } from 'react-native';

import type { UserProfile } from '@/types/domain';

const PROFILE_KEY = 'voter.local-profile.v1';

export async function loadProfile(): Promise<UserProfile | null> {
  try {
    const value = Platform.OS === 'web'
      ? (typeof window === 'undefined' ? null : window.localStorage.getItem(PROFILE_KEY))
      : await (await import('expo-secure-store')).getItemAsync(PROFILE_KEY);
    return value ? (JSON.parse(value) as UserProfile) : null;
  } catch {
    return null;
  }
}

export async function saveProfile(profile: UserProfile) {
  const value = JSON.stringify(profile);
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.localStorage.setItem(PROFILE_KEY, value);
    return;
  }
  await (await import('expo-secure-store')).setItemAsync(PROFILE_KEY, value);
}

export async function deleteProfile() {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.localStorage.removeItem(PROFILE_KEY);
    return;
  }
  await (await import('expo-secure-store')).deleteItemAsync(PROFILE_KEY);
}
