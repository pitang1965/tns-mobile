import { Pressable, StyleSheet, View } from 'react-native';

import type { ReferralOrigin } from '@/analytics/analytics';
import type { SpotV1 } from '@/api/spots';
import { SpotMarkButton } from '@/components/spot-mark-button';
import { ThemedText } from '@/components/themed-text';
import type { SpotMarkState } from '@/constants/spot-marks';
import { Spacing } from '@/constants/theme';
import { openSpotWeb } from '@/lib/referral';

type Props = {
  spot: SpotV1;
  distanceKm: number;
  origin: ReferralOrigin;
  mark: SpotMarkState;
  onChangeMark: (next: SpotMarkState) => void;
};

// スポットカードと一覧行で共通の操作列: 印ボタン + 「詳細を見る」。
// Web誘導はこのボタンの明示的な操作からだけ発生させ、行やカード自体のタップでは飛ばさない
export function SpotActions({ spot, distanceKm, origin, mark, onChangeMark }: Props) {
  return (
    <View style={styles.row}>
      <SpotMarkButton spotName={spot.name} mark={mark} onChange={onChangeMark} />
      <Pressable
        onPress={() => openSpotWeb(spot, origin, distanceKm)}
        hitSlop={Spacing.one}
        style={({ pressed }) => [styles.detailButton, pressed && styles.pressed]}
        accessibilityRole="button"
      >
        <ThemedText type="smallBold" style={styles.detailLabel}>
          詳細を見る ›
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  detailButton: {
    backgroundColor: '#208AEF',
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  pressed: {
    opacity: 0.8,
  },
  detailLabel: {
    color: '#ffffff',
  },
});
