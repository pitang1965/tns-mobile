import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

type Props = {
  maxVehicleHeight?: number;
  noHeightLimit?: boolean;
  heightLimitCaution?: boolean;
};

// スポットの全高制限バッジ。tns-web の SpotHeightBadge と表示規則を揃える:
// - noHeightLimit: 「高さ制限なし」(グリーン)
// - maxVehicleHeight(数値): 「高さ○cm」(スレート)
// - heightLimitCaution: ⚠ を付与しアンバー(区画差・入口の低い梁など要注意)
// - いずれも無い(不明): 何も表示しない
export function SpotHeightBadge({
  maxVehicleHeight,
  noHeightLimit,
  heightLimitCaution,
}: Props) {
  const hasInfo = noHeightLimit || maxVehicleHeight != null;
  if (!hasInfo) {
    return null;
  }

  const label = noHeightLimit ? '高さ制限なし' : `高さ${maxVehicleHeight}cm`;

  const backgroundColor = heightLimitCaution
    ? '#B45309' // amber
    : noHeightLimit
      ? '#047857' // emerald
      : '#475569'; // slate

  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <ThemedText type="smallBold" style={styles.label}>
        {heightLimitCaution ? '⚠ ' : ''}
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.one,
  },
  label: {
    color: '#ffffff',
    fontSize: 12,
    lineHeight: 18,
  },
});
