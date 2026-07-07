import { useEffect, useRef } from 'react';
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

type ClusterMarkerProps = {
  item: Extract<MapItem, { kind: 'cluster' }>;
  onPress: () => void;
};

// クラスタの◯は描画追従を常時ONにする。
// tracksViewChanges=false(凍結)にすると、Androidで①数字がレイアウト前に
// 焼かれて空の◯になる、②分割で削除されても凍結ビットマップが地図に残る
// (ゴースト②)——という2つの不具合が出る。クラスタ◯は同時表示数が少なく
// (個別スポットはネイティブのピンで別扱い)、常時追従でも実用上問題ない
function ClusterMarker({ item, onPress }: ClusterMarkerProps) {
  return (
    <Marker
      coordinate={{ latitude: item.latitude, longitude: item.longitude }}
      anchor={{ x: 0.5, y: 0.5 }}
      onPress={onPress}
      tracksViewChanges
    >
      <View style={styles.cluster}>
        <Text style={styles.clusterLabel}>{item.count}</Text>
      </View>
    </Marker>
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
  const { items, index } = useClusters(spots, region);

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

  const onClusterPress = (item: Extract<MapItem, { kind: 'cluster' }>) => {
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
      {items.map((item) =>
        item.kind === 'cluster' ? (
          // cluster_idはズームごとに別クラスタへ使い回されるため、キーには
          // 内容(件数+丸めた座標)を含める。内容が変わると再マウントされ、
          // ClusterMarkerが数字を焼き直す
          <ClusterMarker
            key={`cluster-${item.count}-${item.latitude.toFixed(3)}-${item.longitude.toFixed(3)}`}
            item={item}
            onPress={() => onClusterPress(item)}
          />
        ) : (
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
        ),
      )}
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
