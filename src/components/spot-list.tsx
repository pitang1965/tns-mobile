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
};

// 件数上限に達しているときは「近い順・上位50件」、そうでなければ距離上限が実際の制約。
// 一覧のヘッダー(FlatList外、スクロールで隠れない場所)に表示するための文言
export function spotListCountLabel(total: number, maxCount?: number, radiusKm?: number): string {
  const atMax = maxCount != null && total >= maxCount;
  if (atMax) {
    return `近い順・上位${maxCount}件`;
  }
  return radiusKm != null ? `${total}件(近い順・${radiusKm}km以内)` : `${total}件(近い順)`;
}

// 近い順の一覧。行自体はタップしても何も起きず、「詳細を見る」でだけWeb誘導する
// (印ボタンとの押し間違いで意図しないWeb遷移を起こさないため。アプリ内詳細画面は持たない)
export function SpotList({ items, marks, onChangeMark }: Props) {
  const theme = useTheme();
  const total = items.length;

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.spot.id}
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
