import { getLocales } from 'expo-localization';
import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

import { translate } from '@/i18n/translations';
import { deleteProfile, loadProfile, saveProfile } from '@/services/profile-storage';
import type { AppLocale, UserProfile } from '@/types/domain';

interface AppContextValue {
  hydrated: boolean;
  locale: AppLocale;
  profile: UserProfile | null;
  t: (key: string, values?: Record<string, string | number>) => string;
  setLocale: (locale: AppLocale) => Promise<void>;
  completeOnboarding: (profile: UserProfile) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  clearProfile: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);
const getDefaultLocale = (): AppLocale => getLocales()[0]?.languageCode === 'es' ? 'es-US' : 'en-US';

export function AppProvider({ children }: PropsWithChildren) {
  const [hydrated, setHydrated] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [locale, setLocaleState] = useState<AppLocale>(getDefaultLocale);

  useEffect(() => {
    loadProfile().then((saved) => {
      if (saved) {
        setProfile(saved);
        setLocaleState(saved.locale);
      }
      setHydrated(true);
    });
  }, []);

  const value = useMemo<AppContextValue>(() => ({
    hydrated,
    locale,
    profile,
    t: (key, values) => translate(locale, key, values),
    setLocale: async (nextLocale) => {
      setLocaleState(nextLocale);
      if (profile) {
        const next = { ...profile, locale: nextLocale };
        setProfile(next);
        await saveProfile(next);
      }
    },
    completeOnboarding: async (nextProfile) => {
      setProfile(nextProfile);
      setLocaleState(nextProfile.locale);
      await saveProfile(nextProfile);
    },
    updateProfile: async (updates) => {
      if (!profile) return;
      const next = { ...profile, ...updates };
      setProfile(next);
      if (updates.locale) setLocaleState(updates.locale);
      await saveProfile(next);
    },
    clearProfile: async () => {
      await deleteProfile();
      setProfile(null);
    },
  }), [hydrated, locale, profile]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}
