import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { palette } from '@/constants/theme';
import { useApp } from '@/context/app-context';

export default function IndexScreen() {
  const { hydrated, profile } = useApp();
  if (!hydrated) return <View style={styles.loading}><ActivityIndicator color={palette.brand} size="large" /></View>;
  return <Redirect href={profile ? '/(tabs)' : '/onboarding'} />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.canvas },
});
