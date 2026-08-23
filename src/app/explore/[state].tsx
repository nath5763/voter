import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Body, Card, Label, LinkButton, PageHeader, Screen, SourceLine, StatusPill } from '@/components/ui';
import { palette } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { createSeedDataset } from '@/data/seed';
import { getState } from '@/data/states';

export default function ExploreStateScreen() {
  const { state: stateParam } = useLocalSearchParams<{ state: string }>();
  const { locale, t } = useApp();
  const definition = getState(stateParam ?? '');
  if (!definition) return <Screen><LinkButton label={t('back')} onPress={() => router.back()} /><PageHeader title={t('unavailable')} /></Screen>;
  const dataset = createSeedDataset(definition.code);
  return (
    <Screen>
      <LinkButton label={t('back')} onPress={() => router.back()} />
      <PageHeader eyebrow="Exploring — not added to My Elections" title={definition.name} body={t('incompleteData')} />
      {dataset.elections.map((election) => (
        <Card key={election.id}>
          <Label>{election.type}</Label>
          <StatusPill status={election.status} />
          <Text style={styles.title}>{election.name}</Text>
          <Body>{new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeZone: election.timeZone }).format(new Date(election.date + 'T12:00:00Z'))}</Body>
          <SourceLine source={dataset.sources[0]} />
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({ title: { color: palette.ink, fontSize: 23, lineHeight: 29, fontWeight: '800' } });
