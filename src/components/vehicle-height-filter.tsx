import { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  parseVehicleHeightCm,
  type VehicleHeightSettings,
} from '@/lib/height-filter';

type Props = {
  settings: VehicleHeightSettings;
  onChange: (next: VehicleHeightSettings) => void;
};

// クイックフィルタと同じアクセント色(種別とは別概念の共通色)
const ActiveColor = '#208AEF';

// 車高フィルタ。クイックフィルタのチップ列に並ぶチップ＋設定モーダル。
// - 未設定: 「🚐 車高を設定」
// - 設定(不明含む): 「🚐 車高 200cm」
// - 設定(不明除外): 「🚐 車高 200cm (不明なし)」
export function VehicleHeightFilter({ settings, onChange }: Props) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [draftCm, setDraftCm] = useState('');
  const [draftInclude, setDraftInclude] = useState(true);

  const active = settings.vehicleHeight != null;
  const label = !active
    ? '🚐 車高を設定'
    : `🚐 車高 ${settings.vehicleHeight}cm${settings.includeUnknownHeight ? '' : ' (不明なし)'}`;

  const openDialog = () => {
    setDraftCm(settings.vehicleHeight != null ? String(settings.vehicleHeight) : '');
    setDraftInclude(settings.includeUnknownHeight);
    setOpen(true);
  };

  const apply = () => {
    onChange({
      vehicleHeight: parseVehicleHeightCm(draftCm),
      includeUnknownHeight: draftInclude,
    });
    setOpen(false);
  };

  const clear = () => {
    onChange({ vehicleHeight: null, includeUnknownHeight: true });
    setOpen(false);
  };

  return (
    <>
      <Pressable
        onPress={openDialog}
        style={[
          styles.chip,
          { backgroundColor: active ? ActiveColor : theme.backgroundElement },
        ]}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
      >
        <ThemedText
          type={active ? 'smallBold' : 'small'}
          style={active ? styles.activeLabel : undefined}
          themeColor={active ? undefined : 'textSecondary'}
        >
          {label}
        </ThemedText>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          {/* カード内タップでは閉じない */}
          <Pressable
            style={[styles.card, { backgroundColor: theme.background }]}
            onPress={() => {}}
          >
            <ThemedText type="subtitle" style={styles.title}>
              車高で絞り込み
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              入力した車高で入れないスポット(全高制限がそれ以下)を除外します。「高さ制限なし」は常に表示します。
            </ThemedText>

            <View style={styles.field}>
              <ThemedText type="smallBold">車高(cm)</ThemedText>
              <TextInput
                value={draftCm}
                onChangeText={setDraftCm}
                keyboardType="number-pad"
                inputMode="numeric"
                placeholder="例: 229(ハイエース スーパーロング)"
                placeholderTextColor={theme.textSecondary}
                style={[
                  styles.input,
                  {
                    color: theme.text,
                    borderColor: theme.backgroundSelected,
                    backgroundColor: theme.backgroundElement,
                  },
                ]}
                returnKeyType="done"
                onSubmitEditing={apply}
              />
            </View>

            <Pressable
              style={styles.toggleRow}
              onPress={() => setDraftInclude((v) => !v)}
            >
              <Switch
                value={draftInclude}
                onValueChange={setDraftInclude}
                trackColor={{ true: ActiveColor }}
              />
              <ThemedText type="small" themeColor="textSecondary" style={styles.toggleLabel}>
                高さ不明のスポットも表示する
              </ThemedText>
            </Pressable>

            <View style={styles.footer}>
              <Pressable
                onPress={clear}
                style={[styles.button, styles.clearButton, { borderColor: theme.backgroundSelected }]}
                accessibilityRole="button"
              >
                <ThemedText type="smallBold" themeColor="textSecondary">
                  クリア
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={apply}
                style={[styles.button, styles.applyButton]}
                accessibilityRole="button"
              >
                <ThemedText type="smallBold" style={styles.applyLabel}>
                  設定
                </ThemedText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 999,
  },
  activeLabel: {
    color: '#ffffff',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  title: {
    fontSize: 20,
    lineHeight: 28,
  },
  field: {
    gap: Spacing.one,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  toggleLabel: {
    flexShrink: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two + Spacing.one,
    borderRadius: Spacing.two,
  },
  clearButton: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  applyButton: {
    backgroundColor: ActiveColor,
  },
  applyLabel: {
    color: '#ffffff',
  },
});
