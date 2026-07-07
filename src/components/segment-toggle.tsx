import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ViewMode = 'map' | 'list';

type Props = {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
};

const segments: { mode: ViewMode; label: string }[] = [
  { mode: 'map', label: '地図' },
  { mode: 'list', label: '一覧' },
];

export function SegmentToggle({ mode, onChange }: Props) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundElement }]}>
      {segments.map((segment) => {
        const active = segment.mode === mode;
        return (
          <Pressable
            key={segment.mode}
            onPress={() => onChange(segment.mode)}
            style={[
              styles.segment,
              active && { backgroundColor: theme.backgroundSelected },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <ThemedText
              type={active ? 'smallBold' : 'small'}
              themeColor={active ? 'text' : 'textSecondary'}
            >
              {segment.label}
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
});
