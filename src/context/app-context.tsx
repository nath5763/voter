import { getLocales } from 'expo-localization';
import { useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { translate } from '@/i18n/translations-v2';
import { createAsyncQueue } from '@/services/database';
import { deleteAllLocalData, ensureSeedDataset, listNotifications, loadDataset, markAllNotificationsRead, markNotificationRead, refreshDataset } from '@/services/election-repository';
import { deleteProfile, loadProfile, saveProfile } from '@/services/profile-storage';
import { cancelAllLocalReminders, reconcileReminders, requestReminderPermission } from '@/services/reminders';
import type { AppLocale, JurisdictionDataset, NotificationRecord, UserProfile } from '@/types/domain';

interface AppContextValue {
  hydrated: boolean;
  locale: AppLocale;
  profile: UserProfile | null;
  dataset: JurisdictionDataset | null;
  notifications: NotificationRecord[];
  refreshing: boolean;
  refreshError: string | null;
  database: SQLiteDatabase;
  t: (key: string, values?: Record<string, string | number>) => string;
  setLocale: (locale: AppLocale) => Promise<void>;
  completeOnboarding: (profile: UserProfile) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshData: () => Promise<void>;
  enableReminders: () => Promise<'granted' | 'denied' | 'unsupported'>;
  disableReminders: () => Promise<void>;
  openNotification: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  clearProfile: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);
const getDefaultLocale = (): AppLocale => getLocales()[0]?.languageCode === 'es' ? 'es-US' : 'en-US';

export function AppProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const [hydrated, setHydrated] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dataset, setDataset] = useState<JurisdictionDataset | null>(null);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [locale, setLocaleState] = useState<AppLocale>(getDefaultLocale);
  const lastAutomaticRefreshAt = useRef(0);
  const profileRef = useRef<UserProfile | null>(null);
  const [databaseQueue] = useState(createAsyncQueue);

  useEffect(() => {
    void databaseQueue(async () => {
      const saved = await loadProfile(db);
      if (saved) {
        profileRef.current = saved;
        setProfile(saved);
        setLocaleState(saved.locale);
        await ensureSeedDataset(db, saved.jurisdiction.stateCode);
        setDataset(await loadDataset(db, saved.jurisdiction.stateCode));
      }
      setNotifications(await listNotifications(db));
    }).catch((error) => {
      setRefreshError(error instanceof Error ? error.message : String(error));
    }).finally(() => setHydrated(true));
  }, [databaseQueue, db]);

  const refreshForState = useCallback(async (stateCode: string) => {
    setRefreshing(true);
    setRefreshError(null);
    try {
      const result = await refreshDataset(db, stateCode);
      setDataset(result.dataset);
      setNotifications(await listNotifications(db));
      return result.dataset;
    } catch (error) {
      setRefreshError(error instanceof Error ? error.message : String(error));
      const cached = await loadDataset(db, stateCode);
      if (cached) setDataset(cached);
      return cached;
    } finally {
      setRefreshing(false);
    }
  }, [db]);

  useEffect(() => {
    if (!hydrated) return;
    const refreshIfNeeded = async () => {
      const currentProfile = profileRef.current;
      if (!currentProfile) return;
      const now = Date.now();
      if (now - lastAutomaticRefreshAt.current < 15 * 60 * 1000) return;
      lastAutomaticRefreshAt.current = now;
      await databaseQueue(async () => {
        const latestProfile = profileRef.current;
        if (!latestProfile || latestProfile.jurisdiction.stateCode !== currentProfile.jurisdiction.stateCode) return;
        const loaded = await refreshForState(latestProfile.jurisdiction.stateCode);
        if (latestProfile.remindersEnabled && loaded) {
          await reconcileReminders(db, loaded.elections, latestProfile.locale, loaded.datasetVersion);
        }
      });
    };
    const runRefresh = () => void refreshIfNeeded().catch((error) => {
      setRefreshError(error instanceof Error ? error.message : String(error));
    });
    runRefresh();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') runRefresh();
    });
    return () => subscription.remove();
  }, [databaseQueue, db, hydrated, refreshForState]);

  const value = useMemo<AppContextValue>(() => ({
    hydrated,
    locale,
    profile,
    dataset,
    notifications,
    refreshing,
    refreshError,
    database: db,
    t: (key, values) => translate(locale, key, values),
    setLocale: async (nextLocale) => {
      setLocaleState(nextLocale);
      const currentProfile = profileRef.current;
      if (currentProfile) {
        const next = { ...currentProfile, locale: nextLocale };
        await databaseQueue(async () => {
          await saveProfile(db, next);
          if (next.remindersEnabled && dataset) await reconcileReminders(db, dataset.elections, nextLocale, dataset.datasetVersion);
        });
        profileRef.current = next;
        setProfile(next);
      }
    },
    completeOnboarding: async (nextProfile) => {
      await databaseQueue(async () => {
        await saveProfile(db, nextProfile);
        await ensureSeedDataset(db, nextProfile.jurisdiction.stateCode);
        const loaded = await refreshForState(nextProfile.jurisdiction.stateCode);
        if (nextProfile.remindersEnabled && loaded) await reconcileReminders(db, loaded.elections, nextProfile.locale, loaded.datasetVersion);
      });
      profileRef.current = nextProfile;
      setProfile(nextProfile);
      setLocaleState(nextProfile.locale);
    },
    updateProfile: async (updates) => {
      const currentProfile = profileRef.current;
      if (!currentProfile) return;
      const next = { ...currentProfile, ...updates };
      await databaseQueue(async () => {
        await saveProfile(db, next);
        if (updates.jurisdiction) {
          await ensureSeedDataset(db, next.jurisdiction.stateCode);
          const loaded = await refreshForState(next.jurisdiction.stateCode);
          if (next.remindersEnabled && loaded) await reconcileReminders(db, loaded.elections, next.locale, loaded.datasetVersion);
        }
      });
      profileRef.current = next;
      setProfile(next);
      if (updates.locale) setLocaleState(updates.locale);
    },
    refreshData: async () => {
      const currentProfile = profileRef.current;
      if (!currentProfile) return;
      await databaseQueue(async () => {
        const loaded = await refreshForState(currentProfile.jurisdiction.stateCode);
        if (currentProfile.remindersEnabled && loaded) await reconcileReminders(db, loaded.elections, currentProfile.locale, loaded.datasetVersion);
      });
    },
    enableReminders: async () => {
      const permission = await requestReminderPermission(locale);
      const currentProfile = profileRef.current;
      if (permission === 'granted' && currentProfile) {
        const next = { ...currentProfile, remindersEnabled: true };
        await databaseQueue(async () => {
          await saveProfile(db, next);
          if (dataset) await reconcileReminders(db, dataset.elections, locale, dataset.datasetVersion);
        });
        profileRef.current = next;
        setProfile(next);
      }
      return permission;
    },
    disableReminders: async () => {
      const currentProfile = profileRef.current;
      const next = currentProfile ? { ...currentProfile, remindersEnabled: false } : null;
      await databaseQueue(async () => {
        await cancelAllLocalReminders(db);
        if (next) await saveProfile(db, next);
      });
      if (next) {
        profileRef.current = next;
        setProfile(next);
      }
    },
    openNotification: async (id) => {
      await databaseQueue(async () => {
        await markNotificationRead(db, id);
        setNotifications(await listNotifications(db));
      });
    },
    markAllRead: async () => {
      await databaseQueue(async () => {
        await markAllNotificationsRead(db);
        setNotifications(await listNotifications(db));
      });
    },
    clearProfile: async () => {
      await databaseQueue(async () => {
        await cancelAllLocalReminders(db);
        await deleteProfile(db);
        await deleteAllLocalData(db);
      });
      profileRef.current = null;
      setProfile(null);
      setDataset(null);
      setNotifications([]);
    },
  }), [databaseQueue, db, dataset, hydrated, locale, notifications, profile, refreshError, refreshForState, refreshing]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}
