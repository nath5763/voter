import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Body, Card, Label, PageHeader, PrimaryButton, Screen, SecondaryButton } from '@/components/ui';
import { palette, radius, spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { createSeedDataset } from '@/data/seed';
import { resolveJurisdiction } from '@/services/jurisdiction-resolver';
import { requestReminderPermission } from '@/services/reminders';
import type { Eligibility, JurisdictionProfile } from '@/types/domain';

const TOTAL_STEPS = 7;

export default function OnboardingScreen() {
  const { locale, setLocale, completeOnboarding, t } = useApp();
  const [step, setStep] = useState(1);
  const [street, setStreet] = useState('');
  const [unit, setUnit] = useState('');
  const [city, setCity] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [jurisdiction, setJurisdiction] = useState<JurisdictionProfile | null>(null);
  const [eligibility, setEligibility] = useState<Eligibility>('PREFER_NOT_TO_SAY');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const resolveAddress = async () => {
    if (!street.trim() || !city.trim() || !/^[A-Za-z]{2}$/.test(stateCode.trim()) || !/^\d{5}(-\d{4})?$/.test(zipCode.trim())) {
      setError(t('addressError'));
      return;
    }
    setBusy(true);
    setError('');
    const result = await resolveJurisdiction({ street, unit, city, stateCode, zipCode });
    setBusy(false);
    if (result.status !== 'success') {
      setError(result.message);
      return;
    }
    setJurisdiction(result.jurisdiction);
    setStep(4);
  };

  const finish = async (remindersEnabled: boolean) => {
    if (!jurisdiction) return;
    setBusy(true);
    setError('');
    try {
      await completeOnboarding({ locale, eligibility, jurisdiction, remindersEnabled, onboardingCompletedAt: new Date().toISOString() });
      router.replace('/(tabs)');
    } catch (finishError) {
      setError(finishError instanceof Error ? `${t('saveFailed')} ${finishError.message}` : t('saveFailed'));
      setBusy(false);
    }
  };

  const allowReminders = async () => {
    setBusy(true);
    setError('');
    try {
      const result = await requestReminderPermission(locale);
      if (result === 'denied') {
        setError(t('reminderDenied'));
        setBusy(false);
        return;
      }
      await finish(result === 'granted');
    } catch (permissionError) {
      setError(permissionError instanceof Error ? `${t('reminderFailed')} ${permissionError.message}` : t('reminderFailed'));
      setBusy(false);
    }
  };

  const previewElection = jurisdiction ? createSeedDataset(jurisdiction.stateCode).elections[0] : undefined;

  return (
    <Screen>
      <View style={styles.progressRow} accessibilityLabel={`Step ${step} of ${TOTAL_STEPS}`}>
        <Text style={styles.wordmark}>{t('appName')}</Text>
        <Text style={styles.progressText}>{step} / {TOTAL_STEPS}</Text>
      </View>
      <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${(step / TOTAL_STEPS) * 100}%` }]} /></View>

      {step === 1 && <>
        <PageHeader title={t('languageTitle')} body={t('languageHelp')} />
        <Choice selected={locale === 'en-US'} label={t('english')} onPress={() => setLocale('en-US')} />
        <Choice selected={locale === 'es-US'} label={t('spanish')} onPress={() => setLocale('es-US')} />
        <PrimaryButton label={t('continue')} onPress={() => setStep(2)} />
      </>}

      {step === 2 && <>
        <PageHeader eyebrow="Privacy" title={t('privacyTitle')} body={t('privacyBody')} />
        <Card><Body>{t('privacyLocal')}</Body></Card>
        <Card><Body>{t('privacyProduction')}</Body></Card>
        <PrimaryButton label={t('continue')} onPress={() => setStep(3)} />
        <SecondaryButton label={t('back')} onPress={() => setStep(1)} />
      </>}

      {step === 3 && <>
        <PageHeader eyebrow="United States" title={t('addressTitle')} body={t('addressHelp')} />
        {error ? <Notice text={error} /> : null}
        <Field label={t('street')} value={street} onChangeText={setStreet} autoComplete="street-address" />
        <Field label={t('unit')} value={unit} onChangeText={setUnit} />
        <Field label={t('city')} value={city} onChangeText={setCity} autoComplete="address-line2" />
        <View style={styles.fieldRow}>
          <Field label={t('state')} value={stateCode} onChangeText={(value) => setStateCode(value.toUpperCase().slice(0, 2))} autoCapitalize="characters" />
          <Field label={t('zip')} value={zipCode} onChangeText={setZipCode} keyboardType="number-pad" autoComplete="postal-code" />
        </View>
        {busy ? <Body muted>{t('addressResolving')}</Body> : null}
        <PrimaryButton disabled={busy} label={t('findDistricts')} onPress={resolveAddress} />
        <SecondaryButton label={t('back')} onPress={() => setStep(2)} />
      </>}

      {step === 4 && jurisdiction && <>
        <PageHeader eyebrow={jurisdiction.stateName} title={t('reviewTitle')} body={t('reviewHelp')} />
        <Card>
          <Text style={styles.address}>{jurisdiction.displayAddress ?? jurisdiction.maskedAddress}</Text>
          <InfoRow label={t('county')} value={jurisdiction.county} />
          <InfoRow label="U.S. House" value={jurisdiction.congressionalDistrict} />
          {jurisdiction.upperLegislativeDistrict ? <InfoRow label={jurisdiction.upperChamberLabel ?? t('upperDistrict')} value={jurisdiction.upperLegislativeDistrict} /> : null}
          {jurisdiction.lowerLegislativeDistrict ? <InfoRow label={jurisdiction.lowerChamberLabel ?? t('lowerDistrict')} value={jurisdiction.lowerLegislativeDistrict} /> : null}
        </Card>
        <PrimaryButton label={t('useAddress')} onPress={() => setStep(5)} />
        <SecondaryButton label={t('editAddress')} onPress={() => setStep(3)} />
      </>}

      {step === 5 && <>
        <PageHeader title={t('eligibilityTitle')} body={t('eligibilityHelp')} />
        <Choice selected={eligibility === 'ELIGIBLE'} label={t('eligible')} onPress={() => setEligibility('ELIGIBLE')} />
        <Choice selected={eligibility === 'PREPARING'} label={t('preparing')} onPress={() => setEligibility('PREPARING')} />
        <Choice selected={eligibility === 'PREFER_NOT_TO_SAY'} label={t('preferNot')} onPress={() => setEligibility('PREFER_NOT_TO_SAY')} />
        <PrimaryButton label={t('continue')} onPress={() => setStep(6)} />
        <SecondaryButton label={t('back')} onPress={() => setStep(4)} />
      </>}

      {step === 6 && previewElection && <>
        <PageHeader eyebrow={t('nextElection')} title={t('foundTitle')} body={t('foundBody')} />
        <Card>
          <Label>{previewElection.type}</Label>
          <Text style={styles.electionName}>{previewElection.name}</Text>
          <Text style={styles.electionDate}>{formatDate(previewElection.date, locale, previewElection.timeZone)}</Text>
          <Body muted>{jurisdiction?.congressionalDistrict}</Body>
        </Card>
        <PrimaryButton label={t('continue')} onPress={() => setStep(7)} />
        <SecondaryButton label={t('back')} onPress={() => setStep(5)} />
      </>}

      {step === 7 && <>
        <PageHeader title={t('reminderTitle')} body={t('reminderBody')} />
        {Platform.OS === 'web' ? <Card><Body>{t('webReminder')}</Body></Card> : null}
        {error ? <Notice text={error} /> : null}
        <PrimaryButton disabled={busy} label={t('allowReminders')} onPress={allowReminders} />
        <SecondaryButton label={t('skipReminders')} onPress={() => { if (!busy) void finish(false); }} />
        <SecondaryButton label={t('back')} onPress={() => setStep(6)} />
      </>}
    </Screen>
  );
}

function Notice({ text }: { text: string }) {
  return <View accessibilityRole="alert" style={styles.notice}><Text style={styles.noticeText}>{text}</Text></View>;
}

function Choice({ selected, label, onPress }: { selected: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={onPress} style={({ pressed }) => [styles.choice, selected && styles.choiceSelected, pressed && styles.pressed]}>
      <View style={[styles.radio, selected && styles.radioSelected]}>{selected ? <View style={styles.radioDot} /> : null}</View>
      <Text style={styles.choiceText}>{label}</Text>
    </Pressable>
  );
}

interface FieldProps {
  label: string; value: string; onChangeText: (value: string) => void; keyboardType?: 'default' | 'number-pad';
  autoComplete?: 'street-address' | 'address-line2' | 'postal-code'; autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

function Field({ label, ...props }: FieldProps) {
  return <View style={styles.field}><Label>{label}</Label><TextInput accessibilityLabel={label} style={styles.input} placeholderTextColor={palette.inkMuted} {...props} /></View>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <View style={styles.infoRow}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>;
}

function formatDate(value: string, locale: string, timeZone: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeZone }).format(new Date(`${value}T12:00:00Z`));
}

const styles = StyleSheet.create({
  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wordmark: { color: palette.ink, fontWeight: '900', fontSize: 20 }, progressText: { color: palette.inkMuted, fontSize: 13, fontWeight: '700' },
  progressTrack: { height: 5, borderRadius: radius.pill, backgroundColor: palette.surfaceMuted, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: palette.brand, borderRadius: radius.pill },
  choice: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, borderRadius: radius.md, padding: spacing.md },
  choiceSelected: { borderColor: palette.brand, backgroundColor: '#EDF7F3' }, pressed: { opacity: 0.78 },
  choiceText: { flex: 1, color: palette.ink, fontSize: 16, lineHeight: 23, fontWeight: '700' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: palette.inkMuted, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: palette.brand }, radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: palette.brand },
  field: { flex: 1, gap: spacing.sm }, fieldRow: { flexDirection: 'row', gap: spacing.md },
  input: { minHeight: 50, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface, borderRadius: radius.md, paddingHorizontal: spacing.md, color: palette.ink, fontSize: 16 },
  notice: { padding: spacing.md, borderRadius: radius.md, backgroundColor: palette.warningSoft, borderWidth: 1, borderColor: '#E3A49C' },
  noticeText: { color: palette.warning, fontSize: 15, lineHeight: 21, fontWeight: '700' },
  address: { color: palette.ink, fontSize: 20, lineHeight: 28, fontWeight: '800' },
  infoRow: { gap: spacing.xs }, infoLabel: { color: palette.inkMuted, fontSize: 12, textTransform: 'uppercase', fontWeight: '800', letterSpacing: 1 },
  infoValue: { color: palette.ink, fontSize: 15, lineHeight: 21 },
  electionName: { color: palette.ink, fontSize: 23, lineHeight: 29, fontWeight: '800' },
  electionDate: { color: palette.accent, fontSize: 17, lineHeight: 24, fontWeight: '800' },
});
