import { StyleSheet, View } from 'react-native';

import type { SpotV1 } from '@/api/spots';
import { SpotHeightBadge } from '@/components/spot-height-badge';
import { ThemedText } from '@/components/themed-text';
import { SpotTypeColors, SpotTypeShortLabels } from '@/constants/spot-types';
import { Spacing } from '@/constants/theme';
import { formatDistanceKm, formatFacilityDistance } from '@/lib/geo';

type Props = {
  spot: SpotV1;
  distanceKm: number;
};

function priceLabel(spot: SpotV1): string {
  if (spot.isFree) {
    return '無料';
  }
  if (spot.pricePerNight != null) {
    return `¥${spot.pricePerNight.toLocaleString()}/泊`;
  }
  return '有料';
}

// 一覧行・スポットカードで共通のスポット要約表示。
// 周辺施設の距離は欠損があっても常に同じ位置に「―」で出す(スポット間で見比べやすくするため)
export function SpotSummary({ spot, distanceKm }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.nameRow}>
        <ThemedText type="smallBold" numberOfLines={1} style={styles.name}>
          {spot.name}
        </ThemedText>
        <View
          style={[styles.typeBadge, { backgroundColor: SpotTypeColors[spot.type] }]}
        >
          <ThemedText type="small" style={styles.typeBadgeLabel}>
            {SpotTypeShortLabels[spot.type]}
          </ThemedText>
        </View>
      </View>

      {(spot.isOvernightProhibited ||
        spot.noHeightLimit ||
        spot.maxVehicleHeight != null) && (
        <View style={styles.badgeRow}>
          {spot.isOvernightProhibited && (
            <View style={styles.prohibitedBadge}>
              <ThemedText type="smallBold" style={styles.prohibitedLabel}>
                ⚠ 車中泊禁止
              </ThemedText>
            </View>
          )}
          <SpotHeightBadge
            maxVehicleHeight={spot.maxVehicleHeight}
            noHeightLimit={spot.noHeightLimit}
            heightLimitCaution={spot.heightLimitCaution}
          />
        </View>
      )}

      <ThemedText type="small" themeColor="textSecondary">
        {formatDistanceKm(distanceKm)} ・ {spot.elevation != null ? `標高${Math.round(spot.elevation)}m` : '標高―'} ・ {priceLabel(spot)}
      </ThemedText>

      <ThemedText type="small" themeColor="textSecondary">
        🚻 {formatFacilityDistance(spot.distanceToToilet)}{'   '}
        🏪 {formatFacilityDistance(spot.distanceToConvenience)}{'   '}
        ♨️ {formatFacilityDistance(spot.distanceToBath)}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  name: {
    flexShrink: 1,
    fontSize: 16,
  },
  typeBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 1,
    borderRadius: Spacing.one,
  },
  typeBadgeLabel: {
    color: '#ffffff',
    fontSize: 12,
    lineHeight: 18,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.one,
  },
  prohibitedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#C62828',
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.one,
  },
  prohibitedLabel: {
    color: '#ffffff',
    fontSize: 12,
    lineHeight: 18,
  },
});
