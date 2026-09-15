import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  AllSpotMarks,
  type SpotMark,
  type SpotMarks,
  type SpotMarkState,
} from '@/constants/spot-marks';

// 印は端末内だけに保存し、サーバーには送らない(ADR-0002)。
// APIからスポットが消えても印は消さず、表示側で出さないだけにする
const STORAGE_KEY = 'spot-marks-v1';

export type UseSpotMarksResult = {
  marks: SpotMarks;
  // 変更後の印一覧を返す(計測で件数を送るため)
  setMark: (spotId: string, next: SpotMarkState) => SpotMarks;
};

function parseMarks(raw: string): SpotMarks {
  const parsed: unknown = JSON.parse(raw);
  if (parsed == null || typeof parsed !== 'object') {
    return {};
  }
  const out: SpotMarks = {};
  for (const [spotId, value] of Object.entries(parsed)) {
    const entry = value as { mark?: unknown; updatedAt?: unknown };
    if (AllSpotMarks.includes(entry?.mark as SpotMark)) {
      out[spotId] = {
        mark: entry.mark as SpotMark,
        updatedAt: typeof entry.updatedAt === 'string' ? entry.updatedAt : '',
      };
    }
  }
  return out;
}

export function useSpotMarks(): UseSpotMarksResult {
  const [marks, setMarksState] = useState<SpotMarks>({});
  // 連続操作でも最新の一覧を元に更新・保存するため ref で持つ
  const marksRef = useRef<SpotMarks>({});
  const loadedRef = useRef(false);
  // 復元前に付けた印。復元結果を上書きで失わないよう、復元時に後勝ちで重ねる
  const pendingRef = useRef<Record<string, SpotMarkState>>({});

  const save = (next: SpotMarks) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {
      // 保存失敗は致命的ではない(セッション内では state が保持される)
    });
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let restored: SpotMarks = {};
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          restored = parseMarks(raw);
        }
      } catch {
        // 復元失敗は印なしのまま(致命的ではない)
      }
      if (cancelled) {
        return;
      }
      const pending = pendingRef.current;
      const merged: SpotMarks = { ...restored };
      for (const [spotId, state] of Object.entries(pending)) {
        if (state === 'none') {
          delete merged[spotId];
        } else {
          merged[spotId] = marksRef.current[spotId] ?? merged[spotId];
        }
      }
      loadedRef.current = true;
      pendingRef.current = {};
      marksRef.current = merged;
      setMarksState(merged);
      if (Object.keys(pending).length > 0) {
        save(merged);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setMark = useCallback((spotId: string, nextState: SpotMarkState) => {
    const next: SpotMarks = { ...marksRef.current };
    if (nextState === 'none') {
      delete next[spotId];
    } else {
      next[spotId] = { mark: nextState, updatedAt: new Date().toISOString() };
    }
    marksRef.current = next;
    setMarksState(next);
    if (loadedRef.current) {
      save(next);
    } else {
      pendingRef.current[spotId] = nextState;
    }
    return next;
  }, []);

  return { marks, setMark };
}
