import { router } from 'expo-router';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';

import { Body, Card, Label, LinkButton, PageHeader, PrimaryButton, PrototypeBanner, Screen, SecondaryButton } from '@/components/ui';
import { palette, spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { cancelPrototypeReminders, enableLocalReminders } from '@/services/local-notifications';

export default function SettingsScreen() {
  const { locale, profile, setLocale, updateProfile, clearProfile, t } = useApp();

  const toggleReminders = async () => {
    if (profile?.remindersEnabled) {
      await cancelPrototypeReminders();
      await updateProfile({ remindersEnabled: false });
    } else {
      const result = await enableLocalReminders(locale);
      await updateProfile({ remindersEnabled: result === 'granted' });
      if (result !== 'granted') Alert.alert(t('reminders'), result === 'unsupported' ? t('webReminder') : t('reminderDenied'));
    }
  };

  const performDelete = async () => {
    await cancelPrototypeReminders();
    await clearProfile();
    router.replace('/onboarding');
  };

  const confirmDelete = () => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`${t('deleteTitle')}\n\n${t('deleteBody')}`)) performDelete();
      return;
    }
    Alert.alert(t('deleteTitle'), t('deleteBody'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('deleteConfirm'), style: 'destructive', onPress: performDelete },
    ]);
  };

  return (
    <Screen>
      <PageHeader title={t('settings')} />
      <PrototypeBanner />
      <Card>
        <Label>{t('profile')}</Label>
        <Text style={styles.address}>{profile?.jurisdiction.displayAddress}</Text>
        <Body muted>{profile?.jurisdiction.congressionalDistrict}</Body>
        <LinkButton label={t('changeAddress')} onPress={() => router.push('/settings/address')} />
      </Card>
      <Card>
        <Label>{t('language')}</Label>
        <View style={styles.buttonRow}>
          <View style={styles.buttonCell}>{locale === 'en-US' ? <PrimaryButton label={t('english')} onPress={() => setLocale('en-US')} /> : <SecondaryButton label={t('english')} onPress={() => setLocale('en-US')} />}</View>
          <View style={styles.buttonCell}>{locale === 'es-US' ? <PrimaryButton label={t('spanish')} onPress={() => setLocale('es-US')} /> : <SecondaryButton label={t('spanish')} onPress={() => setLocale('es-US')} />}</View>
        </View>
      </Card>
      <Card>
        <Label>{t('reminders')}</Label>
        <Text style={styles.value}>{profile?.remindersEnabled ? t('reminderOn') : t('reminderOff')}</Text>
        <SecondaryButton label={profile?.remindersEnabled ? t('reminderOff') : t('allowReminders')} onPress={toggleReminders} />
      </Card>
      <Card>
        <Label>{t('about')}</Label>
        <Body>{t('aboutBody')}</Body>
      </Card>
      <Card>
        <Label>{t('privacyData')}</Label>
        <Body muted>{t('deleteBody')}</Body>
        <SecondaryButton danger label={t('deleteData')} onPress={confirmDelete} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  address: { color: palette.ink, fontSize: 18, lineHeight: 25, fontWeight: '800' },
  value: { color: palette.ink, fontSize: 18, lineHeight: 25, fontWeight: '800' },
  buttonRow: { flexDirection: 'row', gap: spacing.sm },
  buttonCell: { flex: 1 },
});
