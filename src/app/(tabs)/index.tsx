import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Body, Card, Label, LinkButton, PageHeader, PrototypeBanner, Screen, SectionTitle, SourceLine, StatusPill } from '@/components/ui';
import { palette, radius, spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import type { Deadline, Election } from '@/types/domain';

const priority: Deadline['type'][] = ['REGISTRATION', 'MAIL_REQUEST', 'EARLY_START', 'EARLY_END', 'MAIL_RETURN', 'ELECTION_DAY'];

export default function HomeScreen() {
  const { dataset, locale, notifications, profile, t } = useApp();
  const now = new Date().toISOString().slice(0, 10);
  const election = dataset?.elections.filter((item) => item.date >= now).sort((a, b) => a.date.localeCompare(b.date))[0];
  const deadline = nextDeadline(election, now);
  const source = deadline ? dataset?.sources.find((item) => deadline.sourceIds.includes(item.id)) : undefined;
  const unread = notifications.filter((item) => !item.readAt).length;

  return (
    <Screen>
      <PageHeader eyebrow={t('basedOnAddress')} title={t('home')} action={
        <Pressable accessibilityRole="button" accessibilityLabel={t('notifications')} onPress={() => router.push('/notifications')} style={styles.alertButton}>
          <Text style={styles.alertIcon}>●</Text><Text style={styles.alertText}>{unread}</Text>
        </Pressable>
      } />
      <PrototypeBanner />

      {deadline && election ? (
        <Card style={styles.actionCard}>
          <View style={styles.rowBetween}><Label>{t('nextAction')}</Label><StatusPill status={deadline.status} /></View>
          <Text style={styles.actionTitle}>{t(deadlineKey(deadline.type))}</Text>
          <Text style={styles.date}>{t('due')} {formatDate(deadline.date, locale, deadline.timeZone ?? election.timeZone)}</Text>
          <Text style={styles.countdown}>{t('daysAway', { count: daysUntil(deadline.date) })}</Text>
          <LinkButton label={t('viewDeadline')} onPress={() => router.push({ pathname: '/deadlines/[id]', params: { id: deadline.id } })} />
          <SourceLine source={source} />
        </Card>
      ) : null}

      <SectionTitle>{t('nextElection')}</SectionTitle>
      {election ? (
        <Card>
          <View style={styles.rowBetween}><Label>{election.type}</Label><StatusPill status={election.status} /></View>
          <Text style={styles.electionTitle}>{election.name}</Text>
          <Text style={styles.date}>{formatDate(election.date, locale, election.timeZone)}</Text>
          <Body muted>{profile?.jurisdiction.congressionalDistrict}</Body>
          <LinkButton label={t('viewElection')} onPress={() => router.push({ pathname: '/elections/[id]', params: { id: election.id } })} />
        </Card>
      ) : <Card><Body>{t('noElections')}</Body></Card>}

      <SectionTitle>{t('getReady')}</SectionTitle>
      <Card>
        <ChecklistItem text={t('checkRegistration')} />
        <ChecklistItem text={t('reviewId')} />
        <ChecklistItem text={t('chooseVotingMethod')} />
      </Card>

      <View style={styles.jurisdiction}>
        <Label>{t('jurisdiction')}</Label>
        <Body muted>{profile?.jurisdiction.maskedAddress} · {profile?.jurisdiction.county}</Body>
        {dataset ? <Body muted>{t('datasetVersion', { version: dataset.datasetVersion })}</Body> : null}
      </View>
    </Screen>
  );
}

function nextDeadline(election: Election | undefined, today: string) {
  if (!election) return undefined;
  return election.deadlines
    .filter((item) => item.date >= today && item.status !== 'CONFLICTING' && item.status !== 'UNAVAILABLE')
    .sort((a, b) => a.date.localeCompare(b.date) || priority.indexOf(a.type) - priority.indexOf(b.type))[0];
}

function deadlineKey(type: Deadline['type']) {
  return ({ REGISTRATION: 'registration', EARLY_START: 'earlyStart', EARLY_END: 'earlyEnd', MAIL_REQUEST: 'mailRequest', MAIL_RETURN: 'mailReturn', ELECTION_DAY: 'electionDay' } as const)[type];
}

function ChecklistItem({ text }: { text: string }) {
  return <View style={styles.checkItem}><View style={styles.checkbox} /><Text style={styles.checkText}>{text}</Text></View>;
}

function formatDate(value: string, locale: string, timeZone: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone }).format(new Date(`${value}T12:00:00Z`));
}

function daysUntil(value: string) {
  return Math.max(0, Math.ceil((new Date(`${value}T12:00:00Z`).getTime() - Date.now()) / 86_400_000));
}

const styles = StyleSheet.create({
  alertButton: { minWidth: 48, minHeight: 48, borderRadius: 24, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface, alignItems: 'center', justifyContent: 'center' },
  alertIcon: { color: palette.accent, fontSize: 12 }, alertText: { color: palette.ink, fontSize: 11, fontWeight: '800' },
  actionCard: { borderTopWidth: 5, borderTopColor: palette.accent },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
  actionTitle: { color: palette.ink, fontSize: 25, lineHeight: 31, fontWeight: '800' },
  electionTitle: { color: palette.ink, fontSize: 22, lineHeight: 28, fontWeight: '800' },
  date: { color: palette.ink, fontSize: 17, lineHeight: 24, fontWeight: '700' },
  countdown: { color: palette.accent, fontSize: 14, lineHeight: 20, fontWeight: '800' },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 44 },
  checkbox: { width: 22, height: 22, borderRadius: radius.sm, borderWidth: 2, borderColor: palette.brand },
  checkText: { flex: 1, color: palette.ink, fontSize: 16, lineHeight: 22 },
  jurisdiction: { gap: spacing.xs, padding: spacing.sm },
});
