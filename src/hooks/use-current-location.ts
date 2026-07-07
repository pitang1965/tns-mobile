import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

import { track } from '@/analytics/analytics';
import type { LatLng } from '@/lib/geo';

export type CurrentLocationState = {
  coords: LatLng | null;
  // unavailable = 権限拒否または取得失敗。地図中心基準に切り替える
  status: 'pending' | 'available' | 'unavailable';
};

export function useCurrentLocation(): CurrentLocationState {
  const [state, setState] = useState<CurrentLocationState>({
    coords: null,
    status: 'pending',
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        track({
          name: 'location_permission_result',
          properties: { granted: status === 'granted' },
        });
        if (status !== 'granted') {
          if (!cancelled) {
            setState({ coords: null, status: 'unavailable' });
          }
          return;
        }

        // 直近の既知位置があれば先に出して体感を速くする
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown && !cancelled) {
          setState({
            coords: {
              latitude: lastKnown.coords.latitude,
              longitude: lastKnown.coords.longitude,
            },
            status: 'available',
          });
        }

        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!cancelled) {
          setState({
            coords: {
              latitude: current.coords.latitude,
              longitude: current.coords.longitude,
            },
            status: 'available',
          });
        }
      } catch {
        if (!cancelled) {
          // 既知位置が取れていればそのまま使い続ける
          setState((prev) =>
            prev.status === 'available'
              ? prev
              : { coords: null, status: 'unavailable' },
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
