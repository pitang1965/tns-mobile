import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  summary: string;
  children: React.ReactNode;
};

// フィルター行(種別・クイック・車高)は3段あって場所を取るため折りたたみ可能にする。
// 既定は展開(これまでの見た目のまま)。閉じていてもsummaryで絞り込み状態がわかる。
// ヘッダー+中身を1枚のカード背景で囲み、タップで閉じる範囲が見た目でわかるようにする
export function FilterSection({ summary, children }: Props) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(true);

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        style={styles.header}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <ThemedText type="smallBold" themeColor="textSecondary">
          {summary}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {expanded ? '閉じる ▾' : '表示 ▸'}
        </ThemedText>
      </Pressable>
      {expanded && <View style={styles.content}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.three,
    marginTop: Spacing.two,
    marginBottom: Spacing.two,
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  content: {
    gap: Spacing.half,
  },
});
