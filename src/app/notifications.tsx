import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Body, Card, Label, LinkButton, PageHeader, Screen, SecondaryButton, StatusPill } from '@/components/ui';
import { palette, radius, spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';

export default function NotificationsScreen() {
  const { locale, markAllRead, notifications, openNotification, t } = useApp();

  const open = async (id: string, route?: string) => {
    await openNotification(id);
    if (route?.startsWith('/')) router.push(route as never);
  };

  return (
    <Screen>
      <LinkButton label={t('back')} onPress={() => router.back()} />
      <PageHeader title={t('notifications')} body={t('emptyNotificationsBody')} />
      {notifications.length > 0 ? <SecondaryButton label={t('markAllRead')} onPress={markAllRead} /> : null}
      {notifications.length === 0 ? <Card><Text style={styles.title}>{t('emptyNotifications')}</Text><Body>{t('emptyNotificationsBody')}</Body></Card> : notifications.map((item) => (
        <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={item.title} onPress={() => open(item.id, item.route)}>
          <Card>
            <View style={styles.row}>{!item.readAt ? <View style={styles.unread} /> : null}<Label>{formatDate(item.createdAt, locale)}</Label><StatusPill status={item.status} /></View>
            <Text style={styles.title}>{item.title}</Text>
            <Body>{item.message}</Body>
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  unread: { width: 9, height: 9, borderRadius: radius.pill, backgroundColor: palette.accent },
  title: { color: palette.ink, fontSize: 21, lineHeight: 27, fontWeight: '800' },
});
