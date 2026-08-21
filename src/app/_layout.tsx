import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { palette } from '@/constants/theme';
import { AppProvider } from '@/context/app-context';

const voterTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, primary: palette.brand, background: palette.canvas, card: palette.surface, text: palette.ink, border: palette.line },
};

export default function RootLayout() {
  return (
    <AppProvider>
      <ThemeProvider value={voterTheme}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.canvas } }} />
      </ThemeProvider>
    </AppProvider>
  );
}
