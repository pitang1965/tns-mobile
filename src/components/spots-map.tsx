import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';

import type { SpotV1 } from '@/api/spots';
import {
  AllSpotMarks,
  SpotMarkColors,
  type SpotMark,
  type SpotMarks,
} from '@/constants/spot-marks';
import { ProhibitedMarkerColor, SpotTypeColors } from '@/constants/spot-types';
import { useClusters, zoomToLongitudeDelta, type MapItem } from '@/hooks/use-clusters';
import type { LatLng } from '@/lib/geo';

type Props = {
  spots: SpotV1[];
  marks: SpotMarks;
  region: Region;
  onRegionChange: (region: Region) => void;
  userCoords: LatLng | null;
  onSelectSpot: (spot: SpotV1 | null) => void;
  // 並び替え基準(CONTEXT.md)が地図中心のときだけ中心マーカーを見せる。
  // 現在地の印は既存のshowsUserLocationが担うため、ここでは地図中心専用
  usingMapCenter: boolean;
};

type ClusterData = Extract<MapItem, { kind: 'cluster' }>;

// 未使用スロットの退避先(ギニア湾沖。日本の表示領域に入らない)
const HIDDEN_COORDINATE = { latitude: 0, longitude: 0 };

type ClusterMarkerPoolProps = {
  clusters: ClusterData[];
  onPress: (cluster: ClusterData) => void;
};

// アイテムを位置ベースの決定的ハッシュでスロットへ割り当てる。
// 配列順で詰めると、パンやズームのたびに別アイテムが同じスロットに載り、
// ほぼ同じ位置の◯の数字がその場で化けて見える(④→②など)。
// 同じ場所のアイテムが常に同じスロットに載れば、この見かけの誤りが消える
function assignSlots<T>(
  items: T[],
  poolSize: number,
  positionOf: (item: T) => { latitude: number; longitude: number },
): (T | null)[] {
  const slots: (T | null)[] = Array.from({ length: poolSize }, () => null);
  for (const item of items) {
    const { latitude, longitude } = positionOf(item);
    // 約500m格子に丸めた座標のハッシュ。中心が多少動いても同じスロットに留まる
    const hash = Math.abs(
      Math.round(latitude * 200) * 92821 + Math.round(longitude * 200) * 31,
    );
    let slot = hash % poolSize;
    // 衝突は線形探索で空きへ。呼び出し側がpoolSize > items.lengthを保証するが、
    // 万一空きが無くても無限ループしないよう探索回数を上限で打ち切る
    for (let probe = 0; probe < poolSize && slots[slot] != null; probe++) {
      slot = (slot + 1) % poolSize;
    }
    if (slots[slot] == null) {
      slots[slot] = item;
    }
  }
  return slots;
}

// ◯のラベルはスロット固定にする。2〜9は正確な数字、10以上はバケット表記。
// ラベル(=見た目)ごとに独立したプールを持ち、マーカーの見た目は生成後
// 一切変化させない。New Architecture + react-native-mapsには
// ①アンマウント時の削除取りこぼし(ゴースト、#5736)に加えて
// ②カスタムマーカーの子View更新の取りこぼし(#5877)があり、
// スロットの数字Textを書き換える方式では古い数字が表示され続けることが
// 実地で確認された(湯河原駅前: 実体は◯3なのに◯2表示)。
// 位置(coordinate)と表示/非表示(opacity)はネイティブプロパティで信頼できる
const CLUSTER_LABELS = ['2', '3', '4', '5', '6', '7', '8', '9', '10+', '20+', '50+', '100+'] as const;
type ClusterLabel = (typeof CLUSTER_LABELS)[number];

function labelOf(count: number): ClusterLabel {
  if (count < 10) {
    return String(count) as ClusterLabel;
  }
  if (count < 20) {
    return '10+';
  }
  if (count < 50) {
    return '20+';
  }
  if (count < 100) {
    return '50+';
  }
  return '100+';
}

function labelSize(label: ClusterLabel): number {
  if (label === '50+' || label === '100+') {
    return 48;
  }
  if (label === '10+' || label === '20+') {
    return 42;
  }
  return 36;
}

type StaticClusterPoolProps = {
  label: ClusterLabel;
  clusters: ClusterData[];
  onPress: (cluster: ClusterData) => void;
};

// 同一ラベルのクラスタ専用プール。プールは伸ばすだけ(縮めるとアンマウントが
// 起き、ゴーストの原因に戻る)。このレンダーで必要なサイズは即座に
// effectivePoolSizeで使い、stateには「過去最大」を記録する(setStateは
// 次のレンダーまで反映されないため、stateの値をそのまま使うと拡張前の
// サイズでスロット割り当てが走ってしまう)
function StaticClusterPool({ label, clusters, onPress }: StaticClusterPoolProps) {
  const [poolSize, setPoolSize] = useState(0);
  const needed = clusters.length === 0 ? 0 : clusters.length + 4;
  const effectivePoolSize = Math.max(poolSize, needed);
  if (effectivePoolSize > poolSize) {
    setPoolSize(effectivePoolSize);
  }

  if (effectivePoolSize === 0) {
    return null;
  }

  const slots = assignSlots(clusters, effectivePoolSize, (cluster) => cluster);
  const size = labelSize(label);

  return (
    <>
      {slots.map((cluster, slot) => {
        return (
          <Marker
            key={`cluster-${label}-${slot}`}
            coordinate={
              cluster
                ? { latitude: cluster.latitude, longitude: cluster.longitude }
                : HIDDEN_COORDINATE
            }
            anchor={{ x: 0.5, y: 0.5 }}
            opacity={cluster ? 1 : 0}
            onPress={() => {
              if (cluster) {
                onPress(cluster);
              }
            }}
            tracksViewChanges
          >
            <View
              style={[
                styles.cluster,
                { minWidth: size, height: size, borderRadius: size / 2 },
              ]}
            >
              <Text style={styles.clusterLabel}>{label}</Text>
            </View>
          </Marker>
        );
      })}
    </>
  );
}

// 個別ピンも◯と同じプール方式にする。素のMarkerをmapで並べると、
// フィルタでスポットが除外されたときのアンマウントで削除が取りこぼされ(#5736)、
// 「範囲内0件」なのに古いピンが残るゴーストが出る。
// 見た目(pinColor)ごとに独立プールを持ち、生成後は色を変えない
const PinColors = [
  ...new Set([...Object.values(SpotTypeColors), ProhibitedMarkerColor]),
];

function pinColorOf(spot: SpotV1): string {
  return spot.isOvernightProhibited ? ProhibitedMarkerColor : SpotTypeColors[spot.type];
}

type SpotPinPoolProps = {
  color: string;
  spots: SpotV1[];
  onPress: (spot: SpotV1) => void;
};

// 同一色のピン専用プール。伸ばすだけで縮めない(StaticClusterPoolと同じ理由)
function SpotPinPool({ color, spots, onPress }: SpotPinPoolProps) {
  const [poolSize, setPoolSize] = useState(0);
  const needed = spots.length === 0 ? 0 : spots.length + 4;
  const effectivePoolSize = Math.max(poolSize, needed);
  if (effectivePoolSize > poolSize) {
    setPoolSize(effectivePoolSize);
  }

  if (effectivePoolSize === 0) {
    return null;
  }

  const slots = assignSlots(spots, effectivePoolSize, (spot) => ({
    latitude: spot.coordinates[1],
    longitude: spot.coordinates[0],
  }));

  return (
    <>
      {slots.map((spot, slot) => (
        <Marker
          key={`pin-${color}-${slot}`}
          coordinate={
            spot
              ? { latitude: spot.coordinates[1], longitude: spot.coordinates[0] }
              : HIDDEN_COORDINATE
          }
          pinColor={color}
          opacity={spot ? 1 : 0}
          onPress={() => {
            if (spot) {
              onPress(spot);
            }
          }}
        />
      ))}
    </>
  );
}

type SpotMarkerPoolProps = {
  spots: SpotV1[];
  onPress: (spot: SpotV1) => void;
};

function SpotMarkerPool({ spots, onPress }: SpotMarkerPoolProps) {
  return (
    <>
      {PinColors.map((color) => (
        <SpotPinPool
          key={color}
          color={color}
          spots={spots.filter((spot) => pinColorOf(spot) === color)}
          onPress={onPress}
        />
      ))}
    </>
  );
}

// スポットの印マーカー。クラスタにまとめず、どのズームでも印の位置に重ねて出す
// (日本全体を見ながら次の旅を考えるため)。印の種類ごとに独立プールを持ち、
// 見た目は生成後変えない。印を変えたスポットは別の種類のプールへ移るだけ
const MarkBadgeLabels: Record<SpotMark, string> = {
  want: '♡',
  visited: '✓',
  again: '♡✓',
};

type MarkPinPoolProps = {
  mark: SpotMark;
  spots: SpotV1[];
  onPress: (spot: SpotV1) => void;
};

// 同一種類の印マーカー専用プール。伸ばすだけで縮めない(StaticClusterPoolと同じ理由)
function MarkPinPool({ mark, spots, onPress }: MarkPinPoolProps) {
  const [poolSize, setPoolSize] = useState(0);
  const needed = spots.length === 0 ? 0 : spots.length + 4;
  const effectivePoolSize = Math.max(poolSize, needed);
  if (effectivePoolSize > poolSize) {
    setPoolSize(effectivePoolSize);
  }

  if (effectivePoolSize === 0) {
    return null;
  }

  const slots = assignSlots(spots, effectivePoolSize, (spot) => ({
    latitude: spot.coordinates[1],
    longitude: spot.coordinates[0],
  }));

  return (
    <>
      {slots.map((spot, slot) => (
        <Marker
          key={`mark-${mark}-${slot}`}
          coordinate={
            spot
              ? { latitude: spot.coordinates[1], longitude: spot.coordinates[0] }
              : HIDDEN_COORDINATE
          }
          anchor={{ x: 0.5, y: 0.5 }}
          opacity={spot ? 1 : 0}
          zIndex={1000}
          onPress={() => {
            if (spot) {
              onPress(spot);
            }
          }}
          tracksViewChanges
        >
          <View style={[styles.markBadge, { backgroundColor: SpotMarkColors[mark] }]}>
            <Text style={styles.markBadgeLabel}>{MarkBadgeLabels[mark]}</Text>
          </View>
        </Marker>
      ))}
    </>
  );
}

type MarkMarkerPoolProps = {
  spots: SpotV1[];
  marks: SpotMarks;
  onPress: (spot: SpotV1) => void;
};

function MarkMarkerPool({ spots, marks, onPress }: MarkMarkerPoolProps) {
  // 印マーカーは絞り込み後のスポットにだけ出す(他の絞り込みの例外にはしない)
  const marked = spots.filter((spot) => marks[spot.id] != null);
  return (
    <>
      {AllSpotMarks.map((mark) => (
        <MarkPinPool
          key={mark}
          mark={mark}
          spots={marked.filter((spot) => marks[spot.id]?.mark === mark)}
          onPress={onPress}
        />
      ))}
    </>
  );
}

function ClusterMarkerPool({ clusters, onPress }: ClusterMarkerPoolProps) {
  return (
    <>
      {CLUSTER_LABELS.map((label) => (
        <StaticClusterPool
          key={label}
          label={label}
          clusters={clusters.filter((cluster) => labelOf(cluster.count) === label)}
          onPress={onPress}
        />
      ))}
    </>
  );
}

export function SpotsMap({
  spots,
  marks,
  region,
  onRegionChange,
  userCoords,
  onSelectSpot,
  usingMapCenter,
}: Props) {
  const mapRef = useRef<MapView>(null);
  const lastRegionUpdateRef = useRef(0);
  const { items, index } = useClusters(spots, region);

  const clusters = items.filter((item): item is ClusterData => item.kind === 'cluster');
  const spotItems = items.filter(
    (item): item is Extract<MapItem, { kind: 'spot' }> => item.kind === 'spot',
  );

  // 現在地が初めて取れたら現在地周辺へ寄せる(以降のパン操作は妨げない)
  const centeredRef = useRef(false);
  useEffect(() => {
    if (userCoords && !centeredRef.current) {
      centeredRef.current = true;
      mapRef.current?.animateToRegion(
        { ...userCoords, latitudeDelta: 0.25, longitudeDelta: 0.25 },
        600,
      );
    }
  }, [userCoords]);

  const onClusterPress = (item: ClusterData) => {
    const zoom = Math.min(index.getClusterExpansionZoom(item.id), 16);
    const longitudeDelta = zoomToLongitudeDelta(zoom);
    mapRef.current?.animateToRegion(
      {
        latitude: item.latitude,
        longitude: item.longitude,
        latitudeDelta: longitudeDelta,
        longitudeDelta,
      },
      300,
    );
  };

  return (
    <View style={styles.mapContainer}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        // ジェスチャー完了時だけでなくズーム/パン中も間引きつつ再計算する。
        // 完了時のみだと、ピンチ中は古いズーム用の◯が貼り付いたままになり、
        // 指を離した瞬間に中間段階を飛ばして最終形へジャンプして見える
        onRegionChange={(nextRegion) => {
          const now = Date.now();
          if (now - lastRegionUpdateRef.current > 200) {
            lastRegionUpdateRef.current = now;
            onRegionChange(nextRegion);
          }
        }}
        onRegionChangeComplete={onRegionChange}
        showsUserLocation
        showsMyLocationButton
        toolbarEnabled={false}
        onPress={(event) => {
          // Androidではマーカータップでもmap onPressが発火するため区別する
          if (event.nativeEvent.action !== 'marker-press') {
            onSelectSpot(null);
          }
        }}
      >
        <SpotMarkerPool
          spots={spotItems.map((item) => item.spot)}
          onPress={onSelectSpot}
        />
        <ClusterMarkerPool clusters={clusters} onPress={onClusterPress} />
        <MarkMarkerPool spots={spots} marks={marks} onPress={onSelectSpot} />
      </MapView>
      {/* 地図上の座標(Marker)ではなく画面中央への重ね表示にする。regionはクラスタ
          再計算のため間引き更新(200ms)しているため、Marker座標をregionに追従させると
          パン中に遅れて見える。画面中央固定ならReactの状態を経由せず常に正確 */}
      {usingMapCenter && (
        <View style={styles.centerMarkerOverlay} pointerEvents="none">
          <View style={styles.centerMarker}>
            <View style={styles.centerMarkerDot} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  cluster: {
    minWidth: 36,
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 6,
    backgroundColor: '#208AEF',
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clusterLabel: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  markBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markBadgeLabel: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
  centerMarkerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#3A3A3C',
    backgroundColor: 'rgba(58, 58, 60, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerMarkerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3A3A3C',
  },
});
