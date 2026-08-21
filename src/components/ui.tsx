import type { PropsWithChildren, ReactNode } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { maxContentWidth, palette, radius, spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import type { DataStatus, SourceCitation } from '@/types/domain';

export function Screen({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.screen, style]} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function PageHeader({ eyebrow, title, body, action }: { eyebrow?: string; title: string; body?: string; action?: ReactNode }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerCopy}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text accessibilityRole="header" style={styles.title}>{title}</Text>
        {body ? <Text style={styles.body}>{body}</Text> : null}
      </View>
      {action}
    </View>
  );
}

export function PrototypeBanner() {
  const { t } = useApp();
  return (
    <View accessibilityRole="alert" style={styles.prototypeBanner}>
      <Text style={styles.prototypeTitle}>{t('prototype')}</Text>
      <Text style={styles.prototypeText}>{t('prototypeDetail')}</Text>
    </View>
  );
}

export function Card({ children, style, accessibilityLabel }: PropsWithChildren<{ style?: StyleProp<ViewStyle>; accessibilityLabel?: string }>) {
  return <View accessibilityLabel={accessibilityLabel} style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ children }: PropsWithChildren) {
  return <Text accessibilityRole="header" style={styles.sectionTitle}>{children}</Text>;
}

export function Label({ children }: PropsWithChildren) {
  return <Text style={styles.label}>{children}</Text>;
}

export function Body({ children, muted = false }: PropsWithChildren<{ muted?: boolean }>) {
  return <Text style={[styles.body, muted && styles.muted]}>{children}</Text>;
}

export function PrimaryButton({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, pressed && styles.pressed, disabled && styles.disabled]}>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress, danger = false }: { label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.secondaryButton, danger && styles.dangerButton, pressed && styles.pressed]}>
      <Text style={[styles.secondaryButtonText, danger && styles.dangerText]}>{label}</Text>
    </Pressable>
  );
}

export function LinkButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="link" onPress={onPress} style={styles.linkButton}>
      <Text style={styles.linkText}>{label} →</Text>
    </Pressable>
  );
}

export function StatusPill({ status }: { status: DataStatus }) {
  const { t } = useApp();
  const isWarning = status !== 'VERIFIED';
  return (
    <View style={[styles.pill, isWarning ? styles.pillWarning : styles.pillVerified]}>
      <Text style={[styles.pillText, isWarning ? styles.pillWarningText : styles.pillVerifiedText]}>{t(status.toLowerCase())}</Text>
    </View>
  );
}

export function SourceLine({ source }: { source?: SourceCitation }) {
  const { locale, t } = useApp();
  if (!source) return null;
  const verified = source.verifiedAt ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(source.verifiedAt)) : undefined;
  return (
    <View style={styles.sourceLine}>
      <Text style={styles.sourceText}>{source.providerName}{verified ? ` · ${t('verified')} ${verified}` : ''}</Text>
      <Pressable accessibilityRole="link" onPress={() => Linking.openURL(source.url)}>
        <Text style={styles.sourceLink}>{t(source.official ? 'openSource' : 'officialSource')} ↗</Text>
      </Pressable>
    </View>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.canvas },
  screen: { width: '100%', maxWidth: maxContentWidth, alignSelf: 'center', paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: 112, gap: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md, paddingVertical: spacing.sm },
  headerCopy: { flex: 1, gap: spacing.sm },
  eyebrow: { color: palette.accent, fontSize: 12, lineHeight: 16, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' },
  title: { color: palette.ink, fontSize: 34, lineHeight: 39, fontWeight: '800', letterSpacing: -0.8 },
  sectionTitle: { color: palette.ink, fontSize: 20, lineHeight: 26, fontWeight: '800' },
  body: { color: palette.ink, fontSize: 16, lineHeight: 24 },
  muted: { color: palette.inkMuted },
  label: { color: palette.inkMuted, fontSize: 12, lineHeight: 16, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  prototypeBanner: { backgroundColor: palette.warningSoft, borderColor: '#E7CB8B', borderWidth: 1, borderRadius: radius.md, padding: spacing.md, gap: spacing.xs },
  prototypeTitle: { color: palette.warning, fontSize: 13, lineHeight: 18, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  prototypeText: { color: palette.ink, fontSize: 14, lineHeight: 20 },
  card: { backgroundColor: palette.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.line, padding: spacing.lg, gap: spacing.md },
  button: { minHeight: 50, borderRadius: radius.pill, backgroundColor: palette.brand, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  buttonText: { color: palette.white, fontSize: 16, lineHeight: 22, fontWeight: '800' },
  secondaryButton: { minHeight: 48, borderRadius: radius.pill, borderWidth: 1, borderColor: palette.brand, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  secondaryButtonText: { color: palette.brandDark, fontSize: 16, lineHeight: 22, fontWeight: '800' },
  dangerButton: { borderColor: palette.danger },
  dangerText: { color: palette.danger },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.45 },
  linkButton: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
  linkText: { color: palette.brandDark, fontSize: 15, lineHeight: 21, fontWeight: '800', textDecorationLine: 'underline' },
  pill: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  pillVerified: { backgroundColor: '#DCEEE7' },
  pillWarning: { backgroundColor: palette.warningSoft },
  pillText: { fontSize: 12, lineHeight: 16, fontWeight: '800' },
  pillVerifiedText: { color: palette.verified },
  pillWarningText: { color: palette.warning },
  sourceLine: { borderTopWidth: 1, borderTopColor: palette.line, paddingTop: spacing.md, gap: spacing.sm },
  sourceText: { color: palette.inkMuted, fontSize: 13, lineHeight: 19 },
  sourceLink: { color: palette.brandDark, fontSize: 14, lineHeight: 20, fontWeight: '800', textDecorationLine: 'underline' },
  divider: { height: 1, backgroundColor: palette.line },
});
