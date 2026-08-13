import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import {
  DefaultVehicleHeightSettings,
  type VehicleHeightSettings,
} from '@/lib/height-filter';

// 自車高は車のスペックで滅多に変わらないため、クイックフィルタ(起動ごとにリセット)とは
// 別に永続化する。次回起動時も入力済みの車高を保持し、再入力の手間を省く。
const STORAGE_KEY = 'vehicle-height-settings-v1';

export type UseVehicleHeightResult = {
  settings: VehicleHeightSettings;
  setSettings: (next: VehicleHeightSettings) => void;
  // 復元完了フラグ。復元前に保存して既定値で上書きするのを防ぐ
  loaded: boolean;
};

export function useVehicleHeight(): UseVehicleHeightResult {
  const [settings, setSettingsState] = useState<VehicleHeightSettings>(
    DefaultVehicleHeightSettings,
  );
  const [loaded, setLoaded] = useState(false);

  // 起動時に保存済みの設定を復元
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw && !cancelled) {
          const parsed = JSON.parse(raw) as Partial<VehicleHeightSettings>;
          setSettingsState({
            vehicleHeight:
              typeof parsed.vehicleHeight === 'number' ? parsed.vehicleHeight : null,
            includeUnknownHeight: parsed.includeUnknownHeight !== false,
          });
        }
      } catch {
        // 復元失敗は既定値のまま(致命的ではない)
      } finally {
        if (!cancelled) {
          setLoaded(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setSettings = useCallback((next: VehicleHeightSettings) => {
    setSettingsState(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {
      // 保存失敗は致命的ではない(セッション内では state が保持される)
    });
  }, []);

  return { settings, setSettings, loaded };
}
