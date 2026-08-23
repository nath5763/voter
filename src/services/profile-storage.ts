import type { SQLiteDatabase } from 'expo-sqlite';
import { Platform } from 'react-native';

import type { UserProfile } from '@/types/domain';

const PROFILE_KEY = 'voter.local-profile.v2';
let webSessionProfile: UserProfile | null = null;

export async function loadProfile(db: SQLiteDatabase): Promise<UserProfile | null> {
  try {
    if (Platform.OS === 'web' && webSessionProfile) return webSessionProfile;
    if (Platform.OS !== 'web') {
      const value = await (await import('expo-secure-store')).getItemAsync(PROFILE_KEY);
      if (value) return JSON.parse(value) as UserProfile;
    }
    const row = await db.getFirstAsync<{ profile_json: string }>('SELECT profile_json FROM app_profile WHERE id = 1');
    return row ? JSON.parse(row.profile_json) as UserProfile : null;
  } catch {
    return null;
  }
}

export async function saveProfile(db: SQLiteDatabase, profile: UserProfile) {
  const sanitized: UserProfile = {
    ...profile,
    jurisdiction: { ...profile.jurisdiction, fullAddress: undefined, displayAddress: undefined },
  };
  await db.runAsync(
    `INSERT INTO app_profile(id, profile_json, updated_at) VALUES (1, ?, ?)
     ON CONFLICT(id) DO UPDATE SET profile_json=excluded.profile_json, updated_at=excluded.updated_at`,
    JSON.stringify(sanitized), new Date().toISOString(),
  );
  if (Platform.OS === 'web') {
    webSessionProfile = profile;
    return;
  }
  await (await import('expo-secure-store')).setItemAsync(PROFILE_KEY, JSON.stringify(profile));
}

export async function deleteProfile(db: SQLiteDatabase) {
  await db.runAsync('DELETE FROM app_profile WHERE id = 1');
  if (Platform.OS === 'web') {
    webSessionProfile = null;
    return;
  }
  await (await import('expo-secure-store')).deleteItemAsync(PROFILE_KEY);
}
