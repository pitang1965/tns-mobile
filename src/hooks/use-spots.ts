import { useCallback, useEffect, useRef, useState } from 'react';

import { fetchSpots, type SpotV1 } from '@/api/spots';
import { loadSpotsCache, saveSpotsCache } from '@/storage/spots-cache';

// 「古いデータ表示」の閾値: 再取得に失敗し、かつ最終取得から24時間超
const STALE_AFTER_MS = 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export type SpotsState = {
  spots: SpotV1[] | null;
  fetchedAt: Date | null;
  // 非null = 古いデータ表示を出す(値は最終取得からの経過日数)
  staleDays: number | null;
  // キャッシュも取得結果も無い初回ロード中
  isLoading: boolean;
  // キャッシュが無く取得にも失敗(リトライ導線を出す)
  loadFailed: boolean;
  refresh: () => void;
};

// SWR方式: キャッシュを即表示し、裏で必ず再取得して成功したら差し替える
export function useSpots(): SpotsState {
  const [spots, setSpots] = useState<SpotV1[] | null>(null);
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null);
  const [cacheChecked, setCacheChecked] = useState(false);
  // 直近の再取得が失敗した時刻(成功したらnullに戻る)
  const [failedAt, setFailedAt] = useState<number | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const revalidate = useCallback(async () => {
    try {
      const response = await fetchSpots();
      const now = new Date();
      if (!mountedRef.current) {
        return;
      }
      setSpots(response.spots);
      setFetchedAt(now);
      setFailedAt(null);
      await saveSpotsCache({ fetchedAt: now.toISOString(), response });
    } catch {
      if (mountedRef.current) {
        setFailedAt(Date.now());
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cache = await loadSpotsCache();
      if (!cancelled && cache) {
        // 再取得が先に完了していた場合は古いキャッシュで上書きしない
        setSpots((current) => current ?? cache.response.spots);
        setFetchedAt((current) => current ?? new Date(cache.fetchedAt));
      }
      if (!cancelled) {
        setCacheChecked(true);
      }
      await revalidate();
    })();
    return () => {
      cancelled = true;
    };
  }, [revalidate]);

  const staleAge =
    failedAt != null && fetchedAt != null ? failedAt - fetchedAt.getTime() : null;
  const staleDays =
    staleAge != null && staleAge > STALE_AFTER_MS
      ? Math.max(1, Math.floor(staleAge / DAY_MS))
      : null;

  return {
    spots,
    fetchedAt,
    staleDays,
    isLoading: spots == null && !(cacheChecked && failedAt != null),
    loadFailed: spots == null && cacheChecked && failedAt != null,
    refresh: () => {
      setFailedAt(null);
      revalidate();
    },
  };
}
