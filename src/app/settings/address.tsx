import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Body, Card, Label, LinkButton, PageHeader, PrimaryButton, PrototypeBanner, Screen } from '@/components/ui';
import { palette, radius, spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';

export default function ChangeAddressScreen() {
  const { profile, updateProfile, t } = useApp();
  const current = profile?.jurisdiction;
  const [street, setStreet] = useState(current?.street ?? '');
  const [city, setCity] = useState(current?.city ?? '');
  const [zipCode, setZipCode] = useState(current?.zipCode ?? '');
  const [error, setError] = useState('');

  const save = async () => {
    if (!street.trim() || !city.trim() || !/^\d{5}$/.test(zipCode)) {
      setError(t('addressError'));
      return;
    }
    if (!current) return;
    const isGulfFixture = zipCode.startsWith('77');
    await updateProfile({ jurisdiction: {
      ...current, street: street.trim(), city: city.trim(), zipCode,
      displayAddress: `${street.trim()}, ${city.trim()}, TX ${zipCode}`,
      county: isGulfFixture ? 'Sample Harris County' : 'Sample Travis County',
      congressionalDistrict: isGulfFixture ? 'Sample U.S. House District 8' : 'Sample U.S. House District 7',
      stateSenateDistrict: isGulfFixture ? 'Sample Texas Senate District 15' : 'Sample Texas Senate District 14',
      stateHouseDistrict: isGulfFixture ? 'Sample Texas House District 137' : 'Sample Texas House District 134',
      resolvedAt: new Date().toISOString(),
    } });
    router.back();
  };

  return (
    <Screen>
      <LinkButton label={t('back')} onPress={() => router.back()} />
      <PageHeader eyebrow={t('sampleJurisdiction')} title={t('changeAddress')} body={t('reviewHelp')} />
      <PrototypeBanner />
      {error ? <View accessibilityRole="alert" style={styles.error}><Text style={styles.errorText}>{error}</Text></View> : null}
      <Card>
        <Field label={t('street')} value={street} onChangeText={setStreet} />
        <Field label={t('city')} value={city} onChangeText={setCity} />
        <Field label={t('zip')} value={zipCode} onChangeText={setZipCode} />
        <Body muted>{t('privacyLocal')}</Body>
      </Card>
      <PrimaryButton label={t('save')} onPress={save} />
    </Screen>
  );
}

function Field({ label, value, onChangeText }: { label: string; value: string; onChangeText: (value: string) => void }) {
  return <View style={styles.field}><Label>{label}</Label><TextInput accessibilityLabel={label} style={styles.input} value={value} onChangeText={onChangeText} /></View>;
}

const styles = StyleSheet.create({
  field: { gap: spacing.sm },
  input: { minHeight: 50, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface, borderRadius: radius.md, paddingHorizontal: spacing.md, color: palette.ink, fontSize: 16 },
  error: { padding: spacing.md, borderRadius: radius.md, backgroundColor: palette.dangerSoft },
  errorText: { color: palette.danger, fontSize: 15, lineHeight: 21, fontWeight: '700' },
});
