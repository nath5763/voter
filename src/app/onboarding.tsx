import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Body, Card, Label, PageHeader, PrimaryButton, PrototypeBanner, Screen, SecondaryButton } from '@/components/ui';
import { palette, radius, spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { nextElection } from '@/data/fixtures';
import { enableLocalReminders } from '@/services/local-notifications';
import type { Eligibility, JurisdictionProfile } from '@/types/domain';

const TOTAL_STEPS = 7;

export default function OnboardingScreen() {
  const { locale, setLocale, completeOnboarding, t } = useApp();
  const [step, setStep] = useState(1);
  const [street, setStreet] = useState('');
  const [unit, setUnit] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [jurisdiction, setJurisdiction] = useState<JurisdictionProfile | null>(null);
  const [eligibility, setEligibility] = useState<Eligibility>('PREFER_NOT_TO_SAY');
  const [error, setError] = useState('');
  const [reminderMessage, setReminderMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const resolveFixtureAddress = () => {
    if (!street.trim() || !city.trim() || !/^\d{5}$/.test(zipCode.trim())) {
      setError(t('addressError'));
      return;
    }
    setError('');
    const isGulfFixture = zipCode.startsWith('77');
    setJurisdiction({
      street: street.trim(), unit: unit.trim() || undefined, city: city.trim(), state: 'TX', zipCode: zipCode.trim(),
      displayAddress: `${street.trim()}${unit.trim() ? `, ${unit.trim()}` : ''}, ${city.trim()}, TX ${zipCode.trim()}`,
      county: isGulfFixture ? 'Sample Harris County' : 'Sample Travis County',
      congressionalDistrict: isGulfFixture ? 'Sample U.S. House District 8' : 'Sample U.S. House District 7',
      stateSenateDistrict: isGulfFixture ? 'Sample Texas Senate District 15' : 'Sample Texas Senate District 14',
      stateHouseDistrict: isGulfFixture ? 'Sample Texas House District 137' : 'Sample Texas House District 134',
      resolvedAt: new Date().toISOString(), resolutionProvider: 'DEVELOPMENT_FIXTURE',
    });
    setStep(4);
  };

  const finish = async (remindersEnabled: boolean) => {
    if (!jurisdiction) return;
    await completeOnboarding({ locale, eligibility, jurisdiction, remindersEnabled, onboardingCompletedAt: new Date().toISOString() });
    router.replace('/(tabs)');
  };

  const enableReminders = async () => {
    setBusy(true);
    const result = await enableLocalReminders(locale);
    if (result === 'granted') await finish(true);
    else if (result === 'unsupported') {
      setReminderMessage(t('webReminder'));
      await finish(false);
    } else {
      setReminderMessage(t('reminderDenied'));
      setBusy(false);
    }
  };

  return (
    <Screen>
      <View style={styles.progressRow} accessibilityLabel={`Step ${step} of ${TOTAL_STEPS}`}>
        <Text style={styles.wordmark}>{t('appName')}</Text>
        <Text style={styles.progressText}>{step} / {TOTAL_STEPS}</Text>
      </View>
      <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${(step / TOTAL_STEPS) * 100}%` }]} /></View>
      <PrototypeBanner />

      {step === 1 && <>
        <PageHeader eyebrow={t('prototype')} title={t('languageTitle')} body={t('languageHelp')} />
        <Choice selected={locale === 'en-US'} label={t('english')} onPress={() => setLocale('en-US')} />
        <Choice selected={locale === 'es-US'} label={t('spanish')} onPress={() => setLocale('es-US')} />
        <PrimaryButton label={t('continue')} onPress={() => setStep(2)} />
      </>}

      {step === 2 && <>
        <PageHeader eyebrow="Privacy" title={t('privacyTitle')} body={t('privacyBody')} />
        <Card><Label>{t('prototype')}</Label><Body>{t('privacyLocal')}</Body></Card>
        <Card><Label>Before launch</Label><Body>{t('privacyProduction')}</Body></Card>
        <PrimaryButton label={t('continue')} onPress={() => setStep(3)} />
        <SecondaryButton label={t('back')} onPress={() => setStep(1)} />
      </>}

      {step === 3 && <>
        <PageHeader eyebrow="Texas pilot" title={t('addressTitle')} body={t('addressHelp')} />
        {error ? <View accessibilityRole="alert" style={styles.error}><Text style={styles.errorText}>{error}</Text></View> : null}
        <Field label={t('street')} value={street} onChangeText={setStreet} autoComplete="street-address" />
        <Field label={t('unit')} value={unit} onChangeText={setUnit} />
        <Field label={t('city')} value={city} onChangeText={setCity} autoComplete="address-line2" />
        <View style={styles.fieldRow}>
          <View style={styles.stateField}><Label>{t('state')}</Label><View style={styles.fixedField}><Text style={styles.fixedText}>Texas</Text></View></View>
          <View style={styles.zipField}><Field label={t('zip')} value={zipCode} onChangeText={setZipCode} keyboardType="number-pad" autoComplete="postal-code" /></View>
        </View>
        <PrimaryButton label={t('findDistricts')} onPress={resolveFixtureAddress} />
        <SecondaryButton label={t('back')} onPress={() => setStep(2)} />
      </>}

      {step === 4 && jurisdiction && <>
        <PageHeader eyebrow={t('sampleJurisdiction')} title={t('reviewTitle')} body={t('reviewHelp')} />
        <Card>
          <Text style={styles.address}>{jurisdiction.displayAddress}</Text>
          <InfoRow label={t('county')} value={jurisdiction.county} />
          <InfoRow label="U.S. House" value={jurisdiction.congressionalDistrict} />
          <InfoRow label="Texas Senate" value={jurisdiction.stateSenateDistrict} />
          <InfoRow label="Texas House" value={jurisdiction.stateHouseDistrict} />
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

      {step === 6 && <>
        <PageHeader eyebrow={t('nextElection')} title={t('foundTitle')} body={t('foundBody')} />
        <Card>
          <Label>{nextElection.type}</Label>
          <Text style={styles.electionName}>{nextElection.name}</Text>
          <Text style={styles.electionDate}>{formatDate(nextElection.date, locale)}</Text>
          <Body muted>{jurisdiction?.congressionalDistrict}</Body>
        </Card>
        <PrimaryButton label={t('continue')} onPress={() => setStep(7)} />
        <SecondaryButton label={t('back')} onPress={() => setStep(5)} />
      </>}

      {step === 7 && <>
        <PageHeader title={t('reminderTitle')} body={t('reminderBody')} />
        {Platform.OS === 'web' ? <Card><Body>{t('webReminder')}</Body></Card> : null}
        {reminderMessage ? <View accessibilityRole="alert" style={styles.notice}><Text style={styles.noticeText}>{reminderMessage}</Text></View> : null}
        <PrimaryButton disabled={busy} label={t('allowReminders')} onPress={enableReminders} />
        <SecondaryButton label={t('skipReminders')} onPress={() => finish(false)} />
        <SecondaryButton label={t('back')} onPress={() => setStep(6)} />
      </>}
    </Screen>
  );
}

function Choice({ selected, label, onPress }: { selected: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={onPress} style={({ pressed }) => [styles.choice, selected && styles.choiceSelected, pressed && styles.pressed]}>
      <View style={[styles.radio, selected && styles.radioSelected]}>{selected ? <View style={styles.radioDot} /> : null}</View>
      <Text style={styles.choiceText}>{label}</Text>
    </Pressable>
  );
}

function Field({ label, ...props }: { label: string; value: string; onChangeText: (value: string) => void; keyboardType?: 'default' | 'number-pad'; autoComplete?: 'street-address' | 'address-line2' | 'postal-code' }) {
  return <View style={styles.field}><Label>{label}</Label><TextInput accessibilityLabel={label} style={styles.input} placeholderTextColor={palette.inkMuted} {...props} /></View>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <View style={styles.infoRow}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>;
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeZone: 'America/Chicago' }).format(new Date(`${value}T12:00:00-06:00`));
}

const styles = StyleSheet.create({
  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wordmark: { color: palette.ink, fontWeight: '900', fontSize: 20, letterSpacing: -0.4 },
  progressText: { color: palette.inkMuted, fontSize: 13, fontWeight: '700' },
  progressTrack: { height: 5, borderRadius: radius.pill, backgroundColor: palette.surfaceMuted, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: palette.brand, borderRadius: radius.pill },
  choice: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, borderRadius: radius.md, padding: spacing.md },
  choiceSelected: { borderColor: palette.brand, backgroundColor: '#EDF7F3' },
  pressed: { opacity: 0.78 },
  choiceText: { flex: 1, color: palette.ink, fontSize: 16, lineHeight: 23, fontWeight: '700' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: palette.inkMuted, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: palette.brand },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: palette.brand },
  field: { flex: 1, gap: spacing.sm },
  fieldRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-end' },
  stateField: { flex: 1, gap: spacing.sm },
  zipField: { flex: 1 },
  input: { minHeight: 50, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface, borderRadius: radius.md, paddingHorizontal: spacing.md, color: palette.ink, fontSize: 16 },
  fixedField: { minHeight: 50, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surfaceMuted, borderRadius: radius.md, paddingHorizontal: spacing.md, justifyContent: 'center' },
  fixedText: { color: palette.ink, fontSize: 16 },
  error: { padding: spacing.md, borderRadius: radius.md, backgroundColor: palette.dangerSoft, borderWidth: 1, borderColor: '#E3A49C' },
  errorText: { color: palette.danger, fontWeight: '700', fontSize: 15, lineHeight: 21 },
  notice: { padding: spacing.md, borderRadius: radius.md, backgroundColor: palette.warningSoft },
  noticeText: { color: palette.warning, fontSize: 15, lineHeight: 21 },
  address: { color: palette.ink, fontSize: 20, lineHeight: 28, fontWeight: '800' },
  infoRow: { gap: spacing.xs },
  infoLabel: { color: palette.inkMuted, fontSize: 12, textTransform: 'uppercase', fontWeight: '800', letterSpacing: 1 },
  infoValue: { color: palette.ink, fontSize: 15, lineHeight: 21 },
  electionName: { color: palette.ink, fontSize: 23, lineHeight: 29, fontWeight: '800' },
  electionDate: { color: palette.accent, fontSize: 17, lineHeight: 24, fontWeight: '800' },
});
