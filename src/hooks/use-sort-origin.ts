import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

// 並び替え基準(CONTEXT.md): 「現在地から」か「地図中心から」かのユーザー選択。
// 旅行計画は数日〜数週間続くため、車高フィルタと同様に次回起動後も引き継ぐ
export type SortOrigin = 'current' | 'map_center';

const STORAGE_KEY = 'sort-origin-v1';
const DEFAULT_SORT_ORIGIN: SortOrigin = 'current';

function isSortOrigin(value: unknown): value is SortOrigin {
  return value === 'current' || value === 'map_center';
}

export type UseSortOriginResult = {
  sortOrigin: SortOrigin;
  setSortOrigin: (next: SortOrigin) => void;
};

export function useSortOrigin(): UseSortOriginResult {
  const [sortOrigin, setSortOriginState] = useState<SortOrigin>(DEFAULT_SORT_ORIGIN);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw && !cancelled && isSortOrigin(raw)) {
          setSortOriginState(raw);
        }
      } catch {
        // 復元失敗は既定値のまま(致命的ではない)
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setSortOrigin = useCallback((next: SortOrigin) => {
    setSortOriginState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {
      // 保存失敗は致命的ではない(セッション内では state が保持される)
    });
  }, []);

  return { sortOrigin, setSortOrigin };
}
