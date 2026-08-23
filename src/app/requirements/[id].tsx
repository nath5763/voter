import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Body, Card, Label, LinkButton, PageHeader, PrototypeBanner, Screen, SourceLine, StatusPill } from '@/components/ui';
import { useApp } from '@/context/app-context';

export default function RequirementDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { dataset, t } = useApp();
  const election = dataset?.elections.find((item) => item.requirements.some((requirement) => requirement.id === id));
  const requirement = election?.requirements.find((item) => item.id === id);
  if (!election || !requirement) {
    return <Screen><LinkButton label={t('back')} onPress={() => router.back()} /><PageHeader title={t('unavailable')} /><Body>{t('noRequirements')}</Body></Screen>;
  }
  const getSource = (sourceId: string) => dataset?.sources.find((source) => source.id === sourceId);
  return (
    <Screen>
      <LinkButton label={t('back')} onPress={() => router.back()} />
      <PageHeader eyebrow={election.name} title={requirement.title} body={requirement.summary} />
      <PrototypeBanner />
      <Card>
        <View><Label>{requirement.type.replaceAll('_', ' ')}</Label><StatusPill status={requirement.status} /></View>
        {requirement.sourceIds.map((sourceId) => <SourceLine key={sourceId} source={getSource(sourceId)} />)}
      </Card>
      <LinkButton label={t('viewElection')} onPress={() => router.push({ pathname: '/elections/[id]', params: { id: election.id } })} />
    </Screen>
  );
}
