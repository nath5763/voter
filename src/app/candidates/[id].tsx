import { router, useLocalSearchParams } from 'expo-router';
import { Linking, StyleSheet, Text } from 'react-native';

import { Body, Card, Label, LinkButton, PageHeader, Screen, SourceLine } from '@/components/ui';
import { palette } from '@/constants/theme';
import { useApp } from '@/context/app-context';

export default function CandidateDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { dataset, t } = useApp();
  const found = dataset?.elections.flatMap((election) => election.contests.map((contest) => ({ election, contest })))
    .map(({ election, contest }) => ({ election, contest, candidate: contest.candidates.find((item) => item.id === id) }))
    .find((item) => item.candidate);
  if (!found?.candidate) return <Screen><LinkButton label={t('back')} onPress={() => router.back()} /><PageHeader title={t('unavailable')} /></Screen>;
  const { candidate, contest } = found;
  const getSource = (sourceId: string) => dataset?.sources.find((source) => source.id === sourceId);

  return (
    <Screen>
      <LinkButton label={t('back')} onPress={() => router.back()} />
      <PageHeader eyebrow={t('candidateDetails')} title={candidate.name} body={`${contest.office}${contest.district ? ` · ${contest.district}` : ''}`} />
      <Card>
        <Label>{t('party')}</Label>
        <Text style={styles.value}>{candidate.party ?? t('notProvided')}</Text>
        <Label>{t('incumbent')}</Label>
        <Text style={styles.value}>{candidate.incumbent === true ? t('incumbent') : t('notProvided')}</Text>
      </Card>
      <Card>
        <Label>{t('campaignSite')}</Label>
        <Body>{t('campaignWarning')}</Body>
        {candidate.campaignUrl ? <LinkButton label={t('campaignSite')} onPress={() => { if (candidate.campaignUrl?.startsWith('https://')) void Linking.openURL(candidate.campaignUrl); }} /> : <Body muted>{t('notProvided')}</Body>}
      </Card>
      <Card>
        <Label>{t('sources')}</Label>
        {candidate.sourceIds.map((sourceId) => <SourceLine key={sourceId} source={getSource(sourceId)} />)}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({ value: { color: palette.ink, fontSize: 18, lineHeight: 25, fontWeight: '800' } });
