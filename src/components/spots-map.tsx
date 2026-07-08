import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';

import type { SpotV1 } from '@/api/spots';
import { ProhibitedMarkerColor, SpotTypeColors } from '@/constants/spot-types';
import { useClusters, zoomToLongitudeDelta, type MapItem } from '@/hooks/use-clusters';
import type { LatLng } from '@/lib/geo';

type Props = {
  spots: SpotV1[];
  region: Region;
  onRegionChange: (region: Region) => void;
  userCoords: LatLng | null;
  onSelectSpot: (spot: SpotV1 | null) => void;
};

type ClusterData = Extract<MapItem, { kind: 'cluster' }>;

// 未使用スロットの退避先(ギニア湾沖。日本の表示領域に入らない)
const HIDDEN_COORDINATE = { latitude: 0, longitude: 0 };

type ClusterMarkerPoolProps = {
  clusters: ClusterData[];
  onPress: (cluster: ClusterData) => void;
};

// クラスタを位置ベースの決定的ハッシュでスロットへ割り当てる。
// 配列順で詰めると、パンやズームのたびに別クラスタが同じスロットに載り、
// ほぼ同じ位置の◯の数字がその場で化けて見える(④→②など)。
// 同じ場所のクラスタが常に同じスロットに載れば、この見かけの誤りが消える
function assignSlots(clusters: ClusterData[], poolSize: number): (ClusterData | null)[] {
  const slots: (ClusterData | null)[] = Array.from({ length: poolSize }, () => null);
  for (const cluster of clusters) {
    // 約500m格子に丸めた座標のハッシュ。中心が多少動いても同じスロットに留まる
    const hash = Math.abs(
      Math.round(cluster.latitude * 200) * 92821 + Math.round(cluster.longitude * 200) * 31,
    );
    let slot = hash % poolSize;
    // 衝突は線形探索で空きへ。呼び出し側がpoolSize > clusters.lengthを保証するが、
    // 万一空きが無くても無限ループしないよう探索回数を上限で打ち切る
    for (let probe = 0; probe < poolSize && slots[slot] != null; probe++) {
      slot = (slot + 1) % poolSize;
    }
    if (slots[slot] == null) {
      slots[slot] = cluster;
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

  const slots = assignSlots(clusters, effectivePoolSize);
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
  region,
  onRegionChange,
  userCoords,
  onSelectSpot,
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
      {spotItems.map((item) => (
        <Marker
          key={item.spot.id}
          coordinate={{
            latitude: item.spot.coordinates[1],
            longitude: item.spot.coordinates[0],
          }}
          pinColor={
            item.spot.isOvernightProhibited
              ? ProhibitedMarkerColor
              : SpotTypeColors[item.spot.type]
          }
          onPress={() => onSelectSpot(item.spot)}
        />
      ))}
      <ClusterMarkerPool clusters={clusters} onPress={onClusterPress} />
    </MapView>
  );
}

const styles = StyleSheet.create({
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
});
