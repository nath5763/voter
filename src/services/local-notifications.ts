import { Platform } from 'react-native';

import type { AppLocale } from '@/types/domain';

const SOURCE = 'voter-prototype';

export async function enableLocalReminders(locale: AppLocale): Promise<'granted' | 'denied' | 'unsupported'> {
  if (Platform.OS === 'web') return 'unsupported';
  const Notifications = await import('expo-notifications');

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('election-deadlines', {
      name: locale === 'es-US' ? 'Fechas electorales' : 'Election deadlines',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  let permission = await Notifications.getPermissionsAsync();
  if (permission.status !== 'granted') permission = await Notifications.requestPermissionsAsync();
  if (permission.status !== 'granted') return 'denied';

  await cancelPrototypeReminders();
  const reminders = [
    { date: '2026-09-28T09:00:00-05:00', title: locale === 'es-US' ? 'Se acerca la fecha de registro' : 'Registration deadline approaching', body: locale === 'es-US' ? 'Revisa la información oficial de registro de Texas.' : 'Review official Texas registration information.' },
    { date: '2026-10-18T09:00:00-05:00', title: locale === 'es-US' ? 'La votación anticipada comienza mañana' : 'Early voting begins tomorrow', body: locale === 'es-US' ? 'Consulta las fechas y requisitos oficiales.' : 'Review the official dates and requirements.' },
    { date: '2026-11-02T09:00:00-06:00', title: locale === 'es-US' ? 'Mañana es el Día de las Elecciones' : 'Election Day is tomorrow', body: locale === 'es-US' ? 'Revisa tu lista de preparación.' : 'Review your preparation checklist.' },
  ];

  for (const reminder of reminders) {
    const date = new Date(reminder.date);
    if (date.getTime() <= Date.now()) continue;
    await Notifications.scheduleNotificationAsync({
      content: { title: reminder.title, body: reminder.body, data: { source: SOURCE, route: '/elections/tx-general-2026' } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: Platform.OS === 'android' ? 'election-deadlines' : undefined },
    });
  }
  return 'granted';
}

export async function cancelPrototypeReminders() {
  if (Platform.OS === 'web') return;
  const Notifications = await import('expo-notifications');
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(scheduled
    .filter((item) => item.content.data?.source === SOURCE)
    .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)));
}
