import { FlatList, StyleSheet, View } from 'react-native';

import type { SpotV1 } from '@/api/spots';
import { SpotActions } from '@/components/spot-actions';
import { SpotSummary } from '@/components/spot-summary';
import { ThemedText } from '@/components/themed-text';
import { markOf, type SpotMarks, type SpotMarkState } from '@/constants/spot-marks';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type SpotWithDistance = {
  spot: SpotV1;
  distanceKm: number;
};

type Props = {
  items: SpotWithDistance[];
  marks: SpotMarks;
  onChangeMark: (spot: SpotV1, next: SpotMarkState) => void;
  // 件数上限(近い順にこの件数で頭打ち)。ヘッダー表記に使う。未指定なら上限なし
  maxCount?: number;
  // 距離上限(km)。件数が上限未満のときは距離が実際の制約になるため表記する
  radiusKm?: number;
};

// 近い順の一覧。行自体はタップしても何も起きず、「詳細を見る」でだけWeb誘導する
// (印ボタンとの押し間違いで意図しないWeb遷移を起こさないため。アプリ内詳細画面は持たない)
export function SpotList({ items, marks, onChangeMark, maxCount, radiusKm }: Props) {
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
        <View style={[styles.row, { borderBottomColor: theme.backgroundElement }]}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.rank}>
            {`${index + 1}/${total}`}
          </ThemedText>
          <View style={styles.rowBody}>
            <SpotSummary spot={item.spot} distanceKm={item.distanceKm} />
            <SpotActions
              spot={item.spot}
              distanceKm={item.distanceKm}
              origin="list_row"
              mark={markOf(marks, item.spot.id)}
              onChangeMark={(next) => onChangeMark(item.spot, next)}
            />
          </View>
        </View>
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
    alignItems: 'flex-start',
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
    gap: Spacing.two,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.six,
  },
});
