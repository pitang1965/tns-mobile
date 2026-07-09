import { useMemo } from 'react';
import { Dimensions } from 'react-native';
import type { Region } from 'react-native-maps';
import Supercluster from 'supercluster';

import type { SpotV1 } from '@/api/spots';

type SpotProps = { spot: SpotV1 };

export type MapItem =
  | {
      kind: 'cluster';
      id: number;
      latitude: number;
      longitude: number;
      count: number;
    }
  | { kind: 'spot'; spot: SpotV1 };

// Web Mercatorのタイル幅。superclusterのズームはこのタイル基準で定義される
const TILE_SIZE = 256;
// 画面は縦固定(app.json orientation: portrait)なので幅は一定
const MAP_WIDTH = Dimensions.get('window').width;

// longitudeDeltaだけでなく画面幅も考慮しないと、supercluster側のズームが
// 実際の見た目より小さく算出され、ズームインしてもクラスタが解けなくなる
export function regionToZoom(region: Region): number {
  const delta = region.longitudeDelta;
  // react-native-mapsは極端なズームアウト(世界規模・経度180°またぎ)のとき
  // longitudeDeltaを0や負値で返すことがある。そのままlog2に渡すとNaN/-Infになり、
  // superclusterのtrees[NaN](undefined)参照で "Cannot read property 'range' of
  // undefined" として落ちる。無効値は最小ズーム(全体表示)にフォールバックする
  if (!(delta > 0)) {
    return 0;
  }
  const zoom = Math.log2((360 * MAP_WIDTH) / (TILE_SIZE * delta));
  if (!Number.isFinite(zoom)) {
    return 0;
  }
  return Math.max(0, Math.min(20, Math.round(zoom)));
}

export function zoomToLongitudeDelta(zoom: number): number {
  return (360 * MAP_WIDTH) / (TILE_SIZE * Math.pow(2, zoom));
}

// 約1,900件を素のMarkerで並べるとAndroidで描画が破綻するため、
// superclusterで表示領域内のみクラスタ化して描画する
export function useClusters(spots: SpotV1[], region: Region) {
  // 完全同一座標のスポットはマーカー上で重なって「開かない2件クラスタ」に
  // 見えるため、地図では1座標=1マーカーに畳む(一覧は全件のまま)。
  // 元データに同名の二重登録が数件あることへの対処
  const uniqueSpots = useMemo(() => {
    const seen = new Set<string>();
    const out: SpotV1[] = [];
    for (const spot of spots) {
      const key = `${spot.coordinates[0]},${spot.coordinates[1]}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      out.push(spot);
    }
    return out;
  }, [spots]);

  const index = useMemo(() => {
    const sc = new Supercluster<SpotProps>({ radius: 48, maxZoom: 14 });
    sc.load(
      uniqueSpots.map((spot) => ({
        type: 'Feature' as const,
        // SpotV1.coordinatesは[lng, lat]でGeoJSONと同順
        geometry: { type: 'Point' as const, coordinates: spot.coordinates },
        properties: { spot },
      })),
    );
    return sc;
  }, [uniqueSpots]);

  const zoom = regionToZoom(region);

  const items = useMemo<MapItem[]>(() => {
    // 表示領域の1.5倍を対象にして、パン直後の空白を減らす。
    // deltaはズームアウト時に負値で返ることがあるため絶対値で半径化し、
    // bboxが反転(min>max)して空クエリになるのを防ぐ
    const halfLng = Math.abs(region.longitudeDelta) * 0.75;
    const halfLat = Math.abs(region.latitudeDelta) * 0.75;
    const bbox: [number, number, number, number] = [
      region.longitude - halfLng,
      region.latitude - halfLat,
      region.longitude + halfLng,
      region.latitude + halfLat,
    ];
    return index.getClusters(bbox, zoom).map((feature) => {
      const [longitude, latitude] = feature.geometry.coordinates;
      if ('cluster' in feature.properties && feature.properties.cluster) {
        return {
          kind: 'cluster' as const,
          id: feature.properties.cluster_id,
          latitude,
          longitude,
          count: feature.properties.point_count,
        };
      }
      return { kind: 'spot' as const, spot: (feature.properties as SpotProps).spot };
    });
  }, [index, region.latitude, region.longitude, region.latitudeDelta, region.longitudeDelta, zoom]);

  return { items, index };
}
