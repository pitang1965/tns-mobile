import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

type Props = {
  text: string;
  tone: 'warning' | 'info';
};

const toneColors = {
  warning: { background: '#FDECEA', text: '#8C1D18' },
  info: { background: '#E8F1FB', text: '#1B4F8A' },
} as const;

export function NoticeBanner({ text, tone }: Props) {
  const colors = toneColors[tone];

  return (
    <View style={[styles.banner, { backgroundColor: colors.background }]}>
      <ThemedText type="small" style={{ color: colors.text }}>
        {text}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
});
