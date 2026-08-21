import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Body, Card, Label, LinkButton, PageHeader, PrototypeBanner, Screen, SectionTitle, SourceLine, StatusPill } from '@/components/ui';
import { palette, radius, spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { getSource, nextElection } from '@/data/fixtures';

const APP_STARTED_AT = Date.now();

export default function HomeScreen() {
  const { locale, profile, t } = useApp();
  const registration = nextElection.deadlines.find((item) => item.type === 'REGISTRATION')!;
  const days = Math.max(0, Math.ceil((new Date(`${registration.date}T12:00:00-05:00`).getTime() - APP_STARTED_AT) / 86_400_000));

  return (
    <Screen>
      <PageHeader eyebrow={t('basedOnAddress')} title={t('home')} action={
        <Pressable accessibilityRole="button" accessibilityLabel={t('notifications')} onPress={() => router.push('/notifications')} style={styles.alertButton}>
          <Text style={styles.alertIcon}>●</Text><Text style={styles.alertText}>1</Text>
        </Pressable>
      } />
      <PrototypeBanner />

      <Card style={styles.actionCard}>
        <View style={styles.rowBetween}><Label>{t('nextAction')}</Label><StatusPill status={registration.status} /></View>
        <Text style={styles.actionTitle}>{t('registerToVote')}</Text>
        <Text style={styles.date}>{t('due')} {formatDate(registration.date, locale)}</Text>
        <Text style={styles.countdown}>{t('daysAway', { count: days })}</Text>
        <LinkButton label={t('viewDeadline')} onPress={() => router.push('/elections/tx-general-2026')} />
        <SourceLine source={getSource(registration.sourceId)} />
      </Card>

      <SectionTitle>{t('nextElection')}</SectionTitle>
      <Card>
        <View style={styles.rowBetween}><Label>{nextElection.type}</Label><StatusPill status={nextElection.status} /></View>
        <Text style={styles.electionTitle}>{nextElection.name}</Text>
        <Text style={styles.date}>{formatDate(nextElection.date, locale)}</Text>
        <Body muted>{profile?.jurisdiction.congressionalDistrict}</Body>
        <LinkButton label={t('viewElection')} onPress={() => router.push('/elections/tx-general-2026')} />
      </Card>

      <SectionTitle>{t('getReady')}</SectionTitle>
      <Card>
        <ChecklistItem text={t('checkRegistration')} />
        <ChecklistItem text={t('reviewId')} />
        <ChecklistItem text={t('chooseVotingMethod')} />
      </Card>

      <View style={styles.jurisdiction}>
        <Label>{t('sampleJurisdiction')}</Label>
        <Body muted>{profile?.jurisdiction.city}, Texas · {profile?.jurisdiction.county}</Body>
      </View>
    </Screen>
  );
}

function ChecklistItem({ text }: { text: string }) {
  return <View style={styles.checkItem}><View style={styles.checkbox} /><Text style={styles.checkText}>{text}</Text></View>;
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'America/Chicago' }).format(new Date(`${value}T12:00:00-06:00`));
}

const styles = StyleSheet.create({
  alertButton: { minWidth: 48, minHeight: 48, borderRadius: 24, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface, alignItems: 'center', justifyContent: 'center' },
  alertIcon: { color: palette.accent, fontSize: 12 },
  alertText: { color: palette.ink, fontSize: 11, fontWeight: '800' },
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
