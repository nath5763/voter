import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Body, Card, Label, LinkButton, PageHeader, PrototypeBanner, Screen, SourceLine } from '@/components/ui';
import { palette } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { getCandidate, getSource } from '@/data/fixtures';

export default function CandidateDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useApp();
  const result = getCandidate(id);
  if (!result) return <Screen><LinkButton label={t('back')} onPress={() => router.back()} /><PageHeader title={t('unavailable')} /></Screen>;
  const { candidate, contest } = result;

  return (
    <Screen>
      <LinkButton label={t('back')} onPress={() => router.back()} />
      <PageHeader eyebrow={t('candidateDetails')} title={candidate.name} body={`${contest.office} · ${contest.district}`} />
      <PrototypeBanner />
      <Card>
        <Label>{t('party')}</Label>
        <Text style={styles.value}>{candidate.party}</Text>
        <Label>{t('incumbent')}</Label>
        <Text style={styles.value}>{candidate.incumbent ? t('incumbent') : t('notIncumbent')}</Text>
      </Card>
      <Card>
        <Label>{t('campaignSite')}</Label>
        <Body>{t('campaignWarning')}</Body>
        <Body muted>Not provided by the synthetic development fixture.</Body>
      </Card>
      <Card>
        <Label>{t('sources')}</Label>
        <SourceLine source={getSource(candidate.sourceId)} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({ value: { color: palette.ink, fontSize: 18, lineHeight: 25, fontWeight: '800' } });
