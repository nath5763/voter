import '@/global.css';

import { DefaultTheme, router, Stack, ThemeProvider } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { palette } from '@/constants/theme';
import { AppProvider } from '@/context/app-context';
import { migrateDatabase } from '@/services/database';
import { configureNotificationHandling } from '@/services/reminders';

const voterTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, primary: palette.brand, background: palette.canvas, card: palette.surface, text: palette.ink, border: palette.line },
};

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="voter.db" onInit={migrateDatabase}>
      <AppProvider>
        <NotificationObserver />
        <ThemeProvider value={voterTheme}>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.canvas } }} />
        </ThemeProvider>
      </AppProvider>
    </SQLiteProvider>
  );
}

function NotificationObserver() {
  useEffect(() => {
    if (Platform.OS === 'web') return;
    let active = true;
    let remove: (() => void) | undefined;
    configureNotificationHandling();
    import('expo-notifications').then((Notifications) => {
      if (!active) return;
      const redirect = (url: unknown) => {
        if (typeof url === 'string' && url.startsWith('/')) router.push(url as never);
      };
      redirect(Notifications.getLastNotificationResponse()?.notification.request.content.data?.url);
      const subscription = Notifications.addNotificationResponseReceivedListener((response) => redirect(response.notification.request.content.data?.url));
      remove = () => subscription.remove();
    });
    return () => { active = false; remove?.(); };
  }, []);
  return null;
}
