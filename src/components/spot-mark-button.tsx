import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import {
  AllSpotMarks,
  SpotMarkColors,
  SpotMarkLabels,
  type SpotMarkState,
} from '@/constants/spot-marks';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  spotName: string;
  mark: SpotMarkState;
  onChange: (next: SpotMarkState) => void;
};

// スポットの印ボタン。印なしは目立たせず、押すとボトムシートで4状態から選ぶ。
// AndroidのAlertはボタン3つまでで4状態+キャンセルが収まらないため Modal で作る
export function SpotMarkButton({ spotName, mark, onChange }: Props) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const marked = mark !== 'none';

  const choose = (next: SpotMarkState) => {
    setOpen(false);
    if (next !== mark) {
      onChange(next);
    }
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        hitSlop={Spacing.one}
        style={({ pressed }) => [
          styles.button,
          marked
            ? { backgroundColor: SpotMarkColors[mark] }
            : { backgroundColor: theme.backgroundElement },
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={marked ? `印: ${SpotMarkLabels[mark]}` : '印を付ける'}
      >
        <ThemedText
          type={marked ? 'smallBold' : 'small'}
          themeColor={marked ? undefined : 'textSecondary'}
          style={marked ? styles.markedLabel : undefined}
        >
          {marked ? SpotMarkLabels[mark] : '♡ 印を付ける'}
        </ThemedText>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          {/* シート内タップでは閉じない */}
          <Pressable
            style={[styles.sheet, { backgroundColor: theme.background }]}
            onPress={() => {}}
          >
            <ThemedText type="smallBold" numberOfLines={1} style={styles.title}>
              {spotName}
            </ThemedText>

            {AllSpotMarks.map((option) => {
              const selected = option === mark;
              return (
                <Pressable
                  key={option}
                  onPress={() => choose(option)}
                  style={({ pressed }) => [
                    styles.option,
                    { borderColor: selected ? SpotMarkColors[option] : theme.backgroundSelected },
                    selected && { backgroundColor: theme.backgroundElement },
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                >
                  <ThemedText
                    type={selected ? 'smallBold' : 'small'}
                    style={{ color: SpotMarkColors[option] }}
                  >
                    {SpotMarkLabels[option]}
                  </ThemedText>
                  {selected && (
                    <ThemedText type="small" themeColor="textSecondary">
                      選択中
                    </ThemedText>
                  )}
                </Pressable>
              );
            })}

            {marked && (
              <Pressable
                onPress={() => choose('none')}
                style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}
                accessibilityRole="button"
              >
                <ThemedText type="small" themeColor="textSecondary">
                  印を外す
                </ThemedText>
              </Pressable>
            )}

            <View style={styles.note}>
              <ThemedText type="small" themeColor="textSecondary">
                印はこの端末にだけ保存されます(機種変更・アンインストールで消えることがあります)
              </ThemedText>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
  },
  pressed: {
    opacity: 0.7,
  },
  markedLabel: {
    color: '#ffffff',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: Spacing.three,
    borderTopRightRadius: Spacing.three,
    padding: Spacing.four,
    paddingBottom: Spacing.five,
    gap: Spacing.two,
  },
  title: {
    fontSize: 16,
    marginBottom: Spacing.one,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + Spacing.one,
  },
  removeButton: {
    alignItems: 'center',
    paddingVertical: Spacing.two + Spacing.one,
  },
  note: {
    marginTop: Spacing.one,
  },
});
