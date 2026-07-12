import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import type { SpotV1 } from '@/api/spots';
import { SpotSummary } from '@/components/spot-summary';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { openSpotWeb } from '@/lib/referral';

export type SpotWithDistance = {
  spot: SpotV1;
  distanceKm: number;
};

type Props = {
  items: SpotWithDistance[];
  // 件数上限(近い順にこの件数で頭打ち)。ヘッダー表記に使う
  maxCount?: number;
  // 距離上限(km)。件数が上限未満のときは距離が実際の制約になるため表記する
  radiusKm?: number;
};

// 近い順の一覧。行タップで即Web誘導(アプリ内詳細画面は持たない)
export function SpotList({ items, maxCount, radiusKm }: Props) {
  const theme = useTheme();
  const total = items.length;
  // 件数上限に達しているときは「近い順50件」、そうでなければ距離上限が実際の制約
  const atMax = maxCount != null && total >= maxCount;
  const headerLabel = atMax
    ? `近い順・上位${maxCount}件`
    : radiusKm != null
      ? `${total}件(近い順・${radiusKm}km以内)`
      : `${total}件(近い順)`;

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.spot.id}
      ListHeaderComponent={
        total > 0 ? (
          <View
            style={[styles.countHeader, { borderBottomColor: theme.backgroundElement }]}
          >
            <ThemedText type="small" themeColor="textSecondary">
              {headerLabel}
            </ThemedText>
          </View>
        ) : null
      }
      renderItem={({ item, index }) => (
        <Pressable
          onPress={() => openSpotWeb(item.spot, 'list_row', item.distanceKm)}
          style={({ pressed }) => [
            styles.row,
            { borderBottomColor: theme.backgroundElement },
            pressed && { backgroundColor: theme.backgroundElement },
          ]}
        >
          <ThemedText type="small" themeColor="textSecondary" style={styles.rank}>
            {`${index + 1}/${total}`}
          </ThemedText>
          <View style={styles.rowBody}>
            <SpotSummary spot={item.spot} distanceKm={item.distanceKm} />
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            ›
          </ThemedText>
        </Pressable>
      )}
      ListEmptyComponent={
        <View style={styles.empty}>
          <ThemedText themeColor="textSecondary">
            該当するスポットがありません
          </ThemedText>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  countHeader: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + Spacing.one,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rank: {
    minWidth: 44,
  },
  rowBody: {
    flex: 1,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.six,
  },
});
