import type { SQLiteDatabase } from 'expo-sqlite';
import { Platform } from 'react-native';

import type { AppLocale, Deadline, Election, ReminderRecord } from '@/types/domain';

const SOURCE = 'voter-phase1';
const CHANNEL = 'election-deadlines';
const MAX_SCHEDULED = 48;
const OFFSETS: Partial<Record<Deadline['type'], number[]>> = {
  REGISTRATION: [14, 7, 1], EARLY_START: [1], MAIL_REQUEST: [7, 1], MAIL_RETURN: [7, 1], ELECTION_DAY: [7, 1, 0],
};

export async function configureNotificationHandling() {
  if (Platform.OS === 'web') return;
  const Notifications = await import('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
  });
}

export async function requestReminderPermission(locale: AppLocale): Promise<'granted' | 'denied' | 'unsupported'> {
  if (Platform.OS === 'web') return 'unsupported';
  const Notifications = await import('expo-notifications');
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: locale === 'es-US' ? 'Fechas electorales' : 'Election deadlines', importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  let permission = await Notifications.getPermissionsAsync();
  if (permission.status !== 'granted') permission = await Notifications.requestPermissionsAsync();
  return permission.status === 'granted' ? 'granted' : 'denied';
}

function zonedDate(date: string, hour: number, timeZone: string) {
  const [year, month, day] = date.split('-').map(Number);
  const guess = Date.UTC(year, month - 1, day, hour);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(guess));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const represented = Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day), Number(values.hour), Number(values.minute));
  return new Date(guess - (represented - guess));
}

export function buildDesiredReminders(elections: Election[], locale: AppLocale, datasetVersion: string) {
  const now = Date.now();
  const reminders: Omit<ReminderRecord, 'expoIdentifier'>[] = [];
  for (const election of elections) {
    for (const deadline of election.deadlines) {
      if (deadline.status !== 'VERIFIED' && deadline.status !== 'CHANGED') continue;
      for (const offset of OFFSETS[deadline.type] ?? []) {
        const trigger = zonedDate(deadline.date, offset === 0 ? 8 : 9, deadline.timeZone ?? election.timeZone);
        trigger.setUTCDate(trigger.getUTCDate() - offset);
        if (trigger.getTime() <= now) continue;
        reminders.push({
          id: `${election.id}:${deadline.id}:${offset}`, electionId: election.id, deadlineId: deadline.id,
          datasetVersion, triggerAt: trigger.toISOString(), locale, category: deadline.type,
        });
      }
    }
  }
  return reminders.sort((a, b) => a.triggerAt.localeCompare(b.triggerAt)).slice(0, MAX_SCHEDULED);
}

function reminderCopy(category: Deadline['type'], locale: AppLocale) {
  const spanish = locale === 'es-US';
  const labels: Record<Deadline['type'], [string, string]> = {
    REGISTRATION: ['Registration deadline approaching', 'Se acerca la fecha límite de registro'],
    EARLY_START: ['Early voting begins soon', 'La votación anticipada comienza pronto'],
    EARLY_END: ['Early voting ends soon', 'La votación anticipada termina pronto'],
    MAIL_REQUEST: ['Mail ballot request deadline approaching', 'Se acerca la fecha para solicitar voto por correo'],
    MAIL_RETURN: ['Mail ballot return deadline approaching', 'Se acerca la fecha para devolver el voto por correo'],
    ELECTION_DAY: ['Election Day is approaching', 'Se acerca el Día de las Elecciones'],
  };
  return {
    title: labels[category][spanish ? 1 : 0],
    body: spanish ? 'Revisa la fecha, las reglas y la fuente oficial en Voter.' : 'Review the date, rules, and official source in Voter.',
  };
}

export async function reconcileReminders(db: SQLiteDatabase, elections: Election[], locale: AppLocale, datasetVersion: string) {
  if (Platform.OS === 'web') return { scheduled: 0, omitted: 0 };
  const Notifications = await import('expo-notifications');
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(existing.filter((item) => item.content.data?.source === SOURCE).map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)));
  await db.runAsync('DELETE FROM reminder_record');
  const desired = buildDesiredReminders(elections, locale, datasetVersion);
  for (const reminder of desired) {
    const expoIdentifier = await Notifications.scheduleNotificationAsync({
      content: { ...reminderCopy(reminder.category, locale), data: { source: SOURCE, url: `/deadlines/${reminder.deadlineId}` } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(reminder.triggerAt), channelId: Platform.OS === 'android' ? CHANNEL : undefined },
    });
    await db.runAsync(
      `INSERT INTO reminder_record(id, expo_identifier, election_id, deadline_id, dataset_version, trigger_at, locale, category)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      reminder.id, expoIdentifier, reminder.electionId, reminder.deadlineId, reminder.datasetVersion, reminder.triggerAt, reminder.locale, reminder.category,
    );
  }
  const potential = elections.flatMap((election) => election.deadlines).reduce((count, deadline) => count + (OFFSETS[deadline.type]?.length ?? 0), 0);
  return { scheduled: desired.length, omitted: Math.max(0, potential - desired.length) };
}

export async function cancelAllLocalReminders(db: SQLiteDatabase) {
  if (Platform.OS !== 'web') {
    const Notifications = await import('expo-notifications');
    const existing = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(existing.filter((item) => item.content.data?.source === SOURCE).map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)));
  }
  await db.runAsync('DELETE FROM reminder_record');
}
