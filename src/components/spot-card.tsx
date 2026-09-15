import { Pressable, StyleSheet, View } from 'react-native';

import type { SpotV1 } from '@/api/spots';
import { SpotActions } from '@/components/spot-actions';
import { SpotSummary } from '@/components/spot-summary';
import { ThemedText } from '@/components/themed-text';
import type { SpotMarkState } from '@/constants/spot-marks';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  spot: SpotV1;
  distanceKm: number;
  mark: SpotMarkState;
  onChangeMark: (next: SpotMarkState) => void;
  onClose: () => void;
};

// 地図でマーカー選択時に出すスポットカード。
// 誤タップで即ブラウザに飛ばさず、「詳細を見る」でWeb誘導する
export function SpotCard({ spot, distanceKm, mark, onChangeMark, onClose }: Props) {
  const theme = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View style={styles.summary}>
          <SpotSummary spot={spot} distanceKm={distanceKm} />
        </View>
        <Pressable onPress={onClose} hitSlop={Spacing.two} accessibilityLabel="閉じる">
          <ThemedText themeColor="textSecondary">✕</ThemedText>
        </Pressable>
      </View>
      <SpotActions
        spot={spot}
        distanceKm={distanceKm}
        origin="map_card"
        mark={mark}
        onChangeMark={onChangeMark}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
    bottom: Spacing.three,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.three,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  summary: {
    flex: 1,
  },
});
