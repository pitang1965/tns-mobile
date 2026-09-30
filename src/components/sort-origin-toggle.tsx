import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { SortOrigin } from '@/hooks/use-sort-origin';

type Props = {
  value: SortOrigin;
  onChange: (value: SortOrigin) => void;
  // 現在地が使えない間は「現在地から」を選べない(地図中心基準に強制される)
  currentLocationAvailable: boolean;
};

const options: { value: SortOrigin; label: string }[] = [
  { value: 'current', label: '現在地から' },
  { value: 'map_center', label: '地図中心から' },
];

export function SortOriginToggle({ value, onChange, currentLocationAvailable }: Props) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundElement }]}>
      {options.map((option) => {
        const active = option.value === value;
        const disabled = option.value === 'current' && !currentLocationAvailable;
        return (
          <Pressable
            key={option.value}
            onPress={() => {
              if (!disabled) {
                onChange(option.value);
              }
            }}
            disabled={disabled}
            style={[
              styles.segment,
              active && { backgroundColor: theme.backgroundSelected },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: active, disabled }}
          >
            <ThemedText
              type={active ? 'smallBold' : 'small'}
              themeColor={disabled ? 'textSecondary' : active ? 'text' : 'textSecondary'}
              style={disabled && styles.disabledLabel}
            >
              {option.label}
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
    borderRadius: Spacing.two,
    padding: Spacing.half,
  },
  segment: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two - Spacing.half,
  },
  disabledLabel: {
    opacity: 0.5,
  },
});
