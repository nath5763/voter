import { Redirect, Tabs } from 'expo-router';
import { Text, useWindowDimensions } from 'react-native';

import { palette } from '@/constants/theme';
import { useApp } from '@/context/app-context';

const icons: Record<string, string> = { index: '⌂', elections: '▤', explore: '◎', settings: '⚙' };

export default function TabsLayout() {
  const { profile, t } = useApp();
  const { width } = useWindowDimensions();
  if (!profile) return <Redirect href="/onboarding" />;
  const wide = width >= 760;

  return (
    <Tabs screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: palette.brandDark,
      tabBarInactiveTintColor: palette.inkMuted,
      tabBarPosition: wide ? 'left' : 'bottom',
      tabBarLabelPosition: wide ? 'beside-icon' : 'below-icon',
      tabBarStyle: wide
        ? { width: 220, paddingVertical: 20, backgroundColor: palette.surface, borderRightColor: palette.line }
        : { height: 72, paddingTop: 7, paddingBottom: 9, backgroundColor: palette.surface, borderTopColor: palette.line },
      tabBarItemStyle: wide ? { maxHeight: 58 } : undefined,
      tabBarLabelStyle: { fontSize: wide ? 15 : 11, fontWeight: '700' },
      tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22, fontWeight: '800' }}>{icons[route.name] ?? '•'}</Text>,
    })}>
      <Tabs.Screen name="index" options={{ title: t('home') }} />
      <Tabs.Screen name="elections" options={{ title: t('elections') }} />
      <Tabs.Screen name="explore" options={{ title: t('explore') }} />
      <Tabs.Screen name="settings" options={{ title: t('settings') }} />
    </Tabs>
  );
}
