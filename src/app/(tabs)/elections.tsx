import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Body, Card, Label, LinkButton, PageHeader, PrototypeBanner, Screen, StatusPill } from '@/components/ui';
import { palette, spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { elections } from '@/data/fixtures';

export default function ElectionsScreen() {
  const { locale, profile, t } = useApp();
  return (
    <Screen>
      <PageHeader eyebrow={profile?.jurisdiction.congressionalDistrict} title={t('elections')} body={t('basedOnAddress')} />
      <PrototypeBanner />
      <View style={styles.filter}><Text style={styles.filterText}>{t('upcoming')} · {elections.length}</Text></View>
      {elections.map((election) => (
        <Card key={election.id}>
          <View style={styles.row}><Label>{election.type}</Label><StatusPill status={election.status} /></View>
          <Text style={styles.title}>{election.name}</Text>
          <Text style={styles.date}>{formatDate(election.date, locale)}</Text>
          <Body muted>{election.contests.length} {t('contests').toLowerCase()}</Body>
          <LinkButton label={t('viewElection')} onPress={() => router.push({ pathname: '/elections/[id]', params: { id: election.id } })} />
        </Card>
      ))}
    </Screen>
  );
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeZone: 'America/Chicago' }).format(new Date(`${value}T12:00:00-06:00`));
}

const styles = StyleSheet.create({
  filter: { alignSelf: 'flex-start', backgroundColor: palette.surfaceMuted, borderRadius: 999, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  filterText: { color: palette.ink, fontWeight: '800', fontSize: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: palette.ink, fontSize: 23, lineHeight: 29, fontWeight: '800' },
  date: { color: palette.accent, fontSize: 16, lineHeight: 22, fontWeight: '800' },
});
