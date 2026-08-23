import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Body, Card, Label, LinkButton, PageHeader, PrototypeBanner, Screen, SourceLine, StatusPill } from '@/components/ui';
import { palette, spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import type { Deadline } from '@/types/domain';

const deadlineKeys: Record<Deadline['type'], string> = {
  REGISTRATION: 'registration', EARLY_START: 'earlyStart', EARLY_END: 'earlyEnd', MAIL_REQUEST: 'mailRequest',
  MAIL_RETURN: 'mailReturn', ELECTION_DAY: 'electionDay',
};

export default function DeadlineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { dataset, locale, t } = useApp();
  const election = dataset?.elections.find((item) => item.deadlines.some((deadline) => deadline.id === id));
  const deadline = election?.deadlines.find((item) => item.id === id);
  if (!election || !deadline) {
    return <Screen><LinkButton label={t('back')} onPress={() => router.back()} /><PageHeader title={t('unavailable')} /><Body>{t('noElections')}</Body></Screen>;
  }
  const getSource = (sourceId: string) => dataset?.sources.find((source) => source.id === sourceId);
  return (
    <Screen>
      <LinkButton label={t('back')} onPress={() => router.back()} />
      <PageHeader eyebrow={election.name} title={t(deadlineKeys[deadline.type])} body={formatDate(deadline.date, locale, deadline.timeZone ?? election.timeZone)} />
      <PrototypeBanner />
      <Card>
        <View style={styles.row}><Label>{t('datasetVersion', { version: dataset?.datasetVersion ?? '' })}</Label><StatusPill status={deadline.status} /></View>
        {deadline.qualifier ? <Body>{deadline.qualifier.replaceAll('_', ' ').toLowerCase()}</Body> : null}
        {deadline.previousDate ? <Text style={styles.previous}>{formatDate(deadline.previousDate, locale, deadline.timeZone ?? election.timeZone)}</Text> : null}
        {deadline.sourceIds.map((sourceId) => <SourceLine key={sourceId} source={getSource(sourceId)} />)}
      </Card>
      <LinkButton label={t('viewElection')} onPress={() => router.push({ pathname: '/elections/[id]', params: { id: election.id } })} />
    </Screen>
  );
}

function formatDate(value: string, locale: string, timeZone: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeZone }).format(new Date(`${value}T12:00:00Z`));
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  previous: { color: palette.inkMuted, fontSize: 14, textDecorationLine: 'line-through' },
});
