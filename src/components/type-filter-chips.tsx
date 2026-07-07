import { Pressable, StyleSheet, View } from 'react-native';

import type { SpotType } from '@/api/spots';
import { ThemedText } from '@/components/themed-text';
import { AllSpotTypes, SpotTypeColors, SpotTypeShortLabels } from '@/constants/spot-types';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  selected: SpotType[];
  onChange: (types: SpotType[]) => void;
};

// 種別フィルタ: 複数選択、未選択=全件表示。
// スクロールさせず折り返しで8種別すべてを一目で見せる
export function TypeFilterChips({ selected, onChange }: Props) {
  const theme = useTheme();

  const toggle = (type: SpotType) => {
    if (selected.includes(type)) {
      onChange(selected.filter((t) => t !== type));
    } else {
      onChange([...selected, type]);
    }
  };

  return (
    <View style={styles.container}>
      {AllSpotTypes.map((type) => {
        const active = selected.includes(type);
        return (
          <Pressable
            key={type}
            onPress={() => toggle(type)}
            style={[
              styles.chip,
              {
                backgroundColor: active ? SpotTypeColors[type] : theme.backgroundElement,
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
              {SpotTypeShortLabels[type]}
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
    paddingVertical: Spacing.two,
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
