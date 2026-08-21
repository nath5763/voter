import { StyleSheet, Text } from 'react-native';

import { Body, Card, Label, PageHeader, PrototypeBanner, Screen } from '@/components/ui';
import { palette } from '@/constants/theme';
import { useApp } from '@/context/app-context';

export default function ExploreScreen() {
  const { t } = useApp();
  return (
    <Screen>
      <PageHeader eyebrow="Texas + United States" title={t('exploreTitle')} body={t('exploreBody')} />
      <PrototypeBanner />
      <Card>
        <Label>Texas</Label>
        <Text style={styles.title}>Statewide election calendar</Text>
        <Body muted>{t('noOtherElections')}</Body>
      </Card>
      <Card>
        <Label>United States</Label>
        <Text style={styles.title}>Federal election calendar</Text>
        <Body muted>{t('noOtherElections')}</Body>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({ title: { color: palette.ink, fontSize: 21, lineHeight: 28, fontWeight: '800' } });
