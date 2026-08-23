import { router, useLocalSearchParams } from 'expo-router';
import { Linking } from 'react-native';

import { Body, Card, Label, LinkButton, PageHeader, Screen, StatusPill } from '@/components/ui';
import { useApp } from '@/context/app-context';

export default function SourceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { dataset, locale, t } = useApp();
  const source = dataset?.sources.find((item) => item.id === id);
  if (!source) {
    return <Screen><LinkButton label={t('back')} onPress={() => router.back()} /><PageHeader title={t('unavailable')} /><Body>{t('notProvided')}</Body></Screen>;
  }
  const format = (value?: string) => value ? new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeStyle: 'short' }).format(new Date(value)) : t('notProvided');
  return (
    <Screen>
      <LinkButton label={t('back')} onPress={() => router.back()} />
      <PageHeader eyebrow={t('sourceDetails')} title={source.providerName} body={source.authorityLevel.replaceAll('_', ' ')} />
      <Card>
        <StatusPill status={source.status ?? (source.official ? 'VERIFIED' : 'INCOMPLETE')} />
        <Label>{t('verified')}</Label><Body>{format(source.verifiedAt)}</Body>
        <Label>{t('retrieved')}</Label><Body>{format(source.retrievedAt)}</Body>
        <LinkButton label={t('openSource')} onPress={() => Linking.openURL(source.url)} />
      </Card>
    </Screen>
  );
}
