import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Label } from '@/components/ui';
import { palette, radius, spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { STATE_BY_CODE, US_JURISDICTIONS } from '@/data/states';

export function StateSelector({ value, onChange }: { value: string; onChange: (stateCode: string) => void }) {
  const { t } = useApp();
  const [visible, setVisible] = useState(false);
  const selected = STATE_BY_CODE.get(value);

  return (
    <View style={styles.field}>
      <Label>{t('state')}</Label>
      <Pressable
        accessibilityLabel={t('selectState')}
        accessibilityRole="button"
        accessibilityState={{ expanded: visible }}
        onPress={() => setVisible(true)}
        style={({ pressed }) => [styles.selector, pressed && styles.pressed]}
      >
        <Text style={[styles.selectorText, !selected && styles.placeholder]}>{selected ? `${selected.name} (${selected.code})` : t('chooseState')}</Text>
        <Text accessibilityElementsHidden importantForAccessibility="no" style={styles.chevron}>⌄</Text>
      </Pressable>

      <Modal animationType="slide" onRequestClose={() => setVisible(false)} presentationStyle="pageSheet" visible={visible}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.modal}>
          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.title}>{t('selectState')}</Text>
            <Pressable accessibilityLabel={t('cancel')} accessibilityRole="button" onPress={() => setVisible(false)} style={styles.closeButton}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>
          <FlatList
            contentContainerStyle={styles.list}
            data={US_JURISDICTIONS}
            initialNumToRender={16}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => {
              const isSelected = item.code === value;
              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => { onChange(item.code); setVisible(false); }}
                  style={({ pressed }) => [styles.option, isSelected && styles.optionSelected, pressed && styles.pressed]}
                >
                  <Text style={[styles.optionName, isSelected && styles.optionNameSelected]}>{item.name}</Text>
                  <Text style={styles.optionCode}>{item.code}{isSelected ? ' ✓' : ''}</Text>
                </Pressable>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.sm },
  selector: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface, borderRadius: radius.md, paddingHorizontal: spacing.md },
  selectorText: { flex: 1, color: palette.ink, fontSize: 16 },
  placeholder: { color: palette.inkMuted },
  chevron: { color: palette.brandDark, fontSize: 22, fontWeight: '800' },
  modal: { flex: 1, backgroundColor: palette.canvas },
  header: { minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, borderBottomWidth: 1, borderBottomColor: palette.line, paddingHorizontal: spacing.md },
  title: { flex: 1, color: palette.ink, fontSize: 24, lineHeight: 30, fontWeight: '800' },
  closeButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill },
  closeText: { color: palette.brandDark, fontSize: 32, lineHeight: 36 },
  list: { padding: spacing.md, gap: spacing.sm },
  option: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, borderWidth: 1, borderColor: palette.line, borderRadius: radius.md, backgroundColor: palette.surface, paddingHorizontal: spacing.md },
  optionSelected: { borderColor: palette.brand, backgroundColor: '#EDF7F3' },
  optionName: { flex: 1, color: palette.ink, fontSize: 16, lineHeight: 22, fontWeight: '700' },
  optionNameSelected: { color: palette.brandDark },
  optionCode: { color: palette.inkMuted, fontSize: 14, lineHeight: 20, fontWeight: '800' },
  pressed: { opacity: 0.72 },
});
