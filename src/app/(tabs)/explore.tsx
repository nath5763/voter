import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Body, Card, Label, PageHeader, PrototypeBanner, Screen } from '@/components/ui';
import { palette, radius, spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { US_JURISDICTIONS } from '@/data/states';

export default function ExploreScreen() {
  const { t } = useApp();
  return (
    <Screen>
      <PageHeader eyebrow="United States" title={t('exploreTitle')} body={t('exploreBody')} />
      <PrototypeBanner />
      <Card>
        <Label>{t('federalCalendar')}</Label>
        <Text style={styles.title}>November 3, 2026</Text>
        <Body muted>{t('coverageCount', { count: US_JURISDICTIONS.length })}</Body>
      </Card>
      <Label>{t('nationwideCoverage')}</Label>
      <View style={styles.grid}>
        {US_JURISDICTIONS.map((state) => (
          <Pressable
            key={state.code}
            accessibilityRole="link"
            accessibilityLabel={state.name}
            onPress={() => router.push({ pathname: '/explore/[state]', params: { state: state.code } })}
            style={({ pressed }) => [styles.stateButton, pressed && styles.pressed]}>
            <Text style={styles.code}>{state.code}</Text>
            <Text style={styles.name}>{state.name}</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: palette.ink, fontSize: 21, lineHeight: 28, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  stateButton: { width: 154, minHeight: 72, borderWidth: 1, borderColor: palette.line, borderRadius: radius.md, backgroundColor: palette.surface, padding: spacing.md, gap: spacing.xs },
  code: { color: palette.accent, fontSize: 13, fontWeight: '900' },
  name: { color: palette.ink, fontSize: 14, lineHeight: 19, fontWeight: '700' },
  pressed: { opacity: 0.72 },
});
