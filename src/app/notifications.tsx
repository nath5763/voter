import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Body, Card, Label, LinkButton, PageHeader, PrototypeBanner, Screen } from '@/components/ui';
import { palette, radius, spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';

export default function NotificationsScreen() {
  const { locale, t } = useApp();
  return (
    <Screen>
      <LinkButton label={t('back')} onPress={() => router.back()} />
      <PageHeader title={t('notifications')} body={t('emptyNotificationsBody')} />
      <PrototypeBanner />
      <Card>
        <View style={styles.row}><View style={styles.unread} /><Label>{formatDate(locale)}</Label></View>
        <Text style={styles.title}>{t('sampleUpdate')}</Text>
        <Body>{t('sampleUpdateBody')}</Body>
        <LinkButton label={t('viewElection')} onPress={() => router.push('/elections/tx-general-2026')} />
      </Card>
    </Screen>
  );
}

function formatDate(locale: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date('2026-08-20T09:00:00-05:00'));
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  unread: { width: 9, height: 9, borderRadius: radius.pill, backgroundColor: palette.accent },
  title: { color: palette.ink, fontSize: 21, lineHeight: 27, fontWeight: '800' },
});
