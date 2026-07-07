import AsyncStorage from '@react-native-async-storage/async-storage';

import type { SpotsV1Response } from '@/api/spots';

const CACHE_KEY = 'spots-cache-v1';

export type CachedSpots = {
  fetchedAt: string; // ISO 8601(アプリが取得に成功した時刻)
  response: SpotsV1Response;
};

export async function loadSpotsCache(): Promise<CachedSpots | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as CachedSpots;
  } catch {
    return null;
  }
}

export async function saveSpotsCache(cache: CachedSpots): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // 保存失敗は致命的ではない(次回オンライン時に再取得される)
  }
}
