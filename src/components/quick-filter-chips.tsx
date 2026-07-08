import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import {
  AllQuickFilterKeys,
  QuickFilterLabels,
  type QuickFilterKey,
} from '@/constants/quick-filters';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  selected: QuickFilterKey[];
  onChange: (keys: QuickFilterKey[]) => void;
};

// 種別(何を見るか)とは別概念の共通アクセント色
const ActiveColor = '#208AEF';

// クイック絞り込み: 複数ONはAND。すべてOFF=絞り込みなし
export function QuickFilterChips({ selected, onChange }: Props) {
  const theme = useTheme();

  const toggle = (key: QuickFilterKey) => {
    if (selected.includes(key)) {
      onChange(selected.filter((k) => k !== key));
    } else {
      onChange([...selected, key]);
    }
  };

  return (
    <View style={styles.container}>
      {AllQuickFilterKeys.map((key) => {
        const active = selected.includes(key);
        return (
          <Pressable
            key={key}
            onPress={() => toggle(key)}
            style={[
              styles.chip,
              {
                backgroundColor: active ? ActiveColor : theme.backgroundElement,
              },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <ThemedText
              type={active ? 'smallBold' : 'small'}
              style={active ? styles.activeLabel : undefined}
              themeColor={active ? undefined : 'textSecondary'}
            >
              {QuickFilterLabels[key]}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 999,
  },
  activeLabel: {
    color: '#ffffff',
  },
});
