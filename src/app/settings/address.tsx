import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Body, Card, Label, LinkButton, PageHeader, PrimaryButton, Screen } from '@/components/ui';
import { StateSelector } from '@/components/state-selector';
import { palette, radius, spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { resolveJurisdiction } from '@/services/jurisdiction-resolver';
import type { JurisdictionProfile } from '@/types/domain';

export default function ChangeAddressScreen() {
  const { profile, updateProfile, t } = useApp();
  const address = profile?.jurisdiction.fullAddress;
  const [street, setStreet] = useState(address?.street ?? '');
  const [unit, setUnit] = useState(address?.unit ?? '');
  const [city, setCity] = useState(address?.city ?? '');
  const [stateCode, setStateCode] = useState(address?.stateCode ?? profile?.jurisdiction.stateCode ?? '');
  const [zipCode, setZipCode] = useState(address?.zipCode ?? '');
  const [preview, setPreview] = useState<JurisdictionProfile | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const resolve = async () => {
    setBusy(true);
    setError('');
    const result = await resolveJurisdiction({ street, unit, city, stateCode, zipCode });
    setBusy(false);
    if (result.status !== 'success') {
      setError(result.message);
      setPreview(null);
      return;
    }
    setPreview(result.jurisdiction);
  };

  const save = async () => {
    if (!preview) return;
    setBusy(true);
    await updateProfile({ jurisdiction: preview });
    router.back();
  };

  return (
    <Screen>
      <LinkButton label={t('back')} onPress={() => router.back()} />
      <PageHeader eyebrow={profile?.jurisdiction.maskedAddress} title={t('changeAddress')} body={t('reviewHelp')} />
      {error ? <View accessibilityRole="alert" style={styles.error}><Text style={styles.errorText}>{error}</Text></View> : null}
      <Card>
        <Field label={t('street')} value={street} onChangeText={setStreet} />
        <Field label={t('unit')} value={unit} onChangeText={setUnit} />
        <Field label={t('city')} value={city} onChangeText={setCity} />
        <StateSelector value={stateCode} onChange={setStateCode} />
        <Field keyboardType="number-pad" label={t('zip')} value={zipCode} onChangeText={setZipCode} />
        <Body muted>{t('privacyLocal')}</Body>
      </Card>
      {preview ? (
        <Card>
          <Label>{t('reviewTitle')}</Label>
          <Text style={styles.preview}>{preview.displayAddress ?? preview.maskedAddress}</Text>
          <Body>{preview.congressionalDistrict}</Body>
          {preview.upperLegislativeDistrict ? <Body>{preview.upperLegislativeDistrict}</Body> : null}
          {preview.lowerLegislativeDistrict ? <Body>{preview.lowerLegislativeDistrict}</Body> : null}
          <PrimaryButton disabled={busy} label={t('save')} onPress={save} />
        </Card>
      ) : <PrimaryButton disabled={busy} label={busy ? t('addressResolving') : t('findDistricts')} onPress={resolve} />}
    </Screen>
  );
}

function Field({ label, value, onChangeText, keyboardType = 'default' }: { label: string; value: string; onChangeText: (value: string) => void; keyboardType?: 'default' | 'number-pad' }) {
  return <View style={styles.field}><Label>{label}</Label><TextInput accessibilityLabel={label} keyboardType={keyboardType} style={styles.input} value={value} onChangeText={onChangeText} /></View>;
}

const styles = StyleSheet.create({
  field: { flex: 1, gap: spacing.sm },
  input: { minHeight: 50, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface, borderRadius: radius.md, paddingHorizontal: spacing.md, color: palette.ink, fontSize: 16 },
  error: { padding: spacing.md, borderRadius: radius.md, backgroundColor: palette.dangerSoft },
  errorText: { color: palette.danger, fontSize: 15, lineHeight: 21, fontWeight: '700' },
  preview: { color: palette.ink, fontSize: 18, lineHeight: 25, fontWeight: '800' },
});
