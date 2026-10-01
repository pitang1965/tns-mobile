import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import type { Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import { spotEventProps, track, type ReferralOrigin } from '@/analytics/analytics';
import type { SpotType, SpotV1 } from '@/api/spots';
import { FilterSection } from '@/components/filter-section';
import { InfoScreen } from '@/components/info-screen';
import { NoticeBanner } from '@/components/notice-banner';
import { QuickFilterChips } from '@/components/quick-filter-chips';
import { SegmentToggle, type ViewMode } from '@/components/segment-toggle';
import { SortOriginToggle } from '@/components/sort-origin-toggle';
import { SpotCard } from '@/components/spot-card';
import { SpotList, spotListCountLabel } from '@/components/spot-list';
import { SpotsMap } from '@/components/spots-map';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TypeFilterChips } from '@/components/type-filter-chips';
import { VehicleHeightFilter } from '@/components/vehicle-height-filter';
import {
  QuickFilterPredicates,
  type QuickFilterKey,
} from '@/constants/quick-filters';
import { countMarks, markOf, type SpotMarkState } from '@/constants/spot-marks';
import { AllSpotTypes } from '@/constants/spot-types';
import { Spacing } from '@/constants/theme';
import { useCurrentLocation } from '@/hooks/use-current-location';
import { useSortOrigin, type SortOrigin } from '@/hooks/use-sort-origin';
import { useSpotMarks } from '@/hooks/use-spot-marks';
import { useSpots } from '@/hooks/use-spots';
import { useVehicleHeight } from '@/hooks/use-vehicle-height';
import { distanceKm, type LatLng } from '@/lib/geo';
import { spotPassesHeightFilter, type VehicleHeightSettings } from '@/lib/height-filter';

// 一覧は起点(現在地または地図中心)から近い順に上位 LIST_MAX_COUNT 件だけ表示する。
// 距離フィルタは遠すぎる件を出さないためのバックストップ(通常は件数上限が先に効く)。
// 地図は表示領域で自然に絞られるため上限をかけない
const LIST_RADIUS_KM = 200;
const LIST_MAX_COUNT = 50;

// 現在地が取れるまで・取れないときの初期表示(日本全体)
const JAPAN_REGION: Region = {
  latitude: 36.5,
  longitude: 137.0,
  latitudeDelta: 16,
  longitudeDelta: 14,
};

function spotLatLng(spot: SpotV1): LatLng {
  return { latitude: spot.coordinates[1], longitude: spot.coordinates[0] };
}

export default function NearbySpotsScreen() {
  const { spots, staleDays, isLoading, loadFailed, refresh } = useSpots();
  const location = useCurrentLocation();
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  // 初期値は全種別ON。selectedTypesは表示する種別のホワイトリスト
  const [selectedTypes, setSelectedTypes] = useState<SpotType[]>(() => [...AllSpotTypes]);
  // クイック絞り込みは起動ごとに全OFF(全件表示)から始める。永続化しない
  const [quickFilters, setQuickFilters] = useState<QuickFilterKey[]>([]);
  // 車高フィルタは車のスペックで変わらないため AsyncStorage に永続化する
  const { settings: heightSettings, setSettings: setHeightSettings } = useVehicleHeight();
  // スポットの印は端末内だけに永続化する(ADR-0002)
  const { marks, setMark } = useSpotMarks();
  // 並び替え基準(CONTEXT.md): 現在地から/地図中心からのユーザー選択。次回起動後も引き継ぐ
  const { sortOrigin, setSortOrigin } = useSortOrigin();
  const [region, setRegion] = useState<Region>(JAPAN_REGION);
  const [selectedSpot, setSelectedSpot] = useState<SpotV1 | null>(null);

  const coords = location.coords;
  const currentLocationAvailable = coords != null;
  // 地図中心基準: 現在地が使えない(強制)か、ユーザーが自ら地図中心を選んだ(手動)状態
  const usingMapCenter = !currentLocationAvailable || sortOrigin === 'map_center';
  const origin = useMemo<LatLng>(
    () =>
      !usingMapCenter && coords
        ? coords
        : { latitude: region.latitude, longitude: region.longitude },
    [usingMapCenter, coords, region.latitude, region.longitude],
  );

  const filteredSpots = useMemo(() => {
    if (!spots) {
      return [];
    }
    const active = new Set(selectedTypes);
    const predicates = quickFilters.map((key) => QuickFilterPredicates[key]);
    return spots.filter(
      (spot) =>
        active.has(spot.type) &&
        predicates.every((matches) => matches(spot, marks)) &&
        spotPassesHeightFilter(spot, heightSettings),
    );
  }, [spots, selectedTypes, quickFilters, heightSettings, marks]);

  // 「行きたい」で絞り込み中は、遠くの行きたい場所も計画の対象なので一覧の距離・件数上限を外す
  const wantToVisitOnly = quickFilters.includes('want_to_visit');
  const listRadiusKm = wantToVisitOnly ? undefined : LIST_RADIUS_KM;
  const listMaxCount = wantToVisitOnly ? undefined : LIST_MAX_COUNT;

  // 種別(減らす方向)とクイック/車高(増やす方向の絞り込み)は意味が違うため、
  // サマリーも分けて表示する(「外すと増える/減る」が混在して分かりにくいとのフィードバック)
  const typeSummary =
    selectedTypes.length === AllSpotTypes.length
      ? '種別(全て)'
      : `種別(${selectedTypes.length})`;
  const narrowingCount =
    quickFilters.length + (heightSettings.vehicleHeight != null ? 1 : 0);
  const narrowingSummary =
    narrowingCount > 0 ? `絞り込み(${narrowingCount})` : '絞り込み(なし)';
  const filterSectionSummary = `${typeSummary}　${narrowingSummary}`;

  // 絞り込みが効いている状態で地図の表示範囲内が0件のときだけ知らせる。
  // 空の地図が「壊れた・データがない」と誤解されるのを防ぐ(一覧には既存の空表示がある)
  const filtersActive = selectedTypes.length < AllSpotTypes.length || narrowingCount > 0;
  const emptyInRegion = useMemo(() => {
    if (!filtersActive) {
      return false;
    }
    const west = region.longitude - region.longitudeDelta / 2;
    const east = region.longitude + region.longitudeDelta / 2;
    const south = region.latitude - region.latitudeDelta / 2;
    const north = region.latitude + region.latitudeDelta / 2;
    return !filteredSpots.some((spot) => {
      const [lng, lat] = spot.coordinates;
      return lng >= west && lng <= east && lat >= south && lat <= north;
    });
  }, [filtersActive, filteredSpots, region]);

  const sortedItems = useMemo(
    () =>
      filteredSpots
        .map((spot) => ({ spot, distanceKm: distanceKm(origin, spotLatLng(spot)) }))
        .filter((item) => listRadiusKm == null || item.distanceKm <= listRadiusKm)
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, listMaxCount),
    [filteredSpots, origin, listRadiusKm, listMaxCount],
  );

  const changeMark = (spot: SpotV1, next: SpotMarkState, markOrigin: ReferralOrigin) => {
    const from = markOf(marks, spot.id);
    const counts = countMarks(setMark(spot.id, next));
    // spot_id・都道府県・距離は送らない(ADR-0002)
    track({
      name: 'spot_mark_changed',
      properties: {
        from,
        to: next,
        origin: markOrigin,
        spot_type: spot.type,
        want_count: counts.want,
        visited_count: counts.visited,
        again_count: counts.again,
      },
    });
  };

  const changeViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    track({ name: 'view_mode_changed', properties: { mode } });
  };

  const changeTypes = (types: SpotType[]) => {
    setSelectedTypes(types);
    setSelectedSpot(null);
    track({ name: 'filter_changed', properties: { types, quick: quickFilters } });
  };

  const changeQuickFilters = (keys: QuickFilterKey[]) => {
    setQuickFilters(keys);
    setSelectedSpot(null);
    track({ name: 'filter_changed', properties: { types: selectedTypes, quick: keys } });
  };

  const changeSortOrigin = (next: SortOrigin) => {
    setSortOrigin(next);
    track({ name: 'sort_origin_changed', properties: { sort_origin: next } });
  };

  const changeHeightSettings = (next: VehicleHeightSettings) => {
    setHeightSettings(next);
    setSelectedSpot(null);
    track({
      name: 'vehicle_height_changed',
      properties: {
        vehicle_height: next.vehicleHeight,
        include_unknown: next.includeUnknownHeight,
      },
    });
  };

  const selectSpot = (spot: SpotV1 | null) => {
    setSelectedSpot(spot);
    if (spot) {
      track({
        name: 'spot_card_opened',
        properties: spotEventProps(spot, distanceKm(origin, spotLatLng(spot))),
      });
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <SegmentToggle mode={viewMode} onChange={changeViewMode} />
          <ThemedText type="small" themeColor="textSecondary">
            車中泊スポットマップ
          </ThemedText>
        </View>

        {/* 情報タブは静的リンク集なので、絞り込みチップやスポット系の通知は出さない */}
        {viewMode !== 'info' && (
          <>
            <FilterSection summary={filterSectionSummary}>
              <TypeFilterChips selected={selectedTypes} onChange={changeTypes} />
              <QuickFilterChips selected={quickFilters} onChange={changeQuickFilters} />
              <View style={styles.heightFilterRow}>
                <VehicleHeightFilter
                  settings={heightSettings}
                  onChange={changeHeightSettings}
                />
              </View>
            </FilterSection>

            {viewMode === 'map' && !isLoading && !loadFailed && emptyInRegion && (
              <NoticeBanner tone="info" text="条件に合うスポットがこの範囲にありません" />
            )}
            {staleDays != null && (
              <NoticeBanner
                tone="warning"
                text={`オフライン: ${staleDays}日前に取得したデータを表示中`}
              />
            )}
            {!currentLocationAvailable && (
              <NoticeBanner
                tone="info"
                text="現在地が使えないため、地図の中心から近い順に表示します"
              />
            )}
          </>
        )}

        <View style={styles.content}>
          {viewMode === 'info' ? (
            <InfoScreen />
          ) : isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" />
              <ThemedText type="small" themeColor="textSecondary">
                スポットを読み込み中…
              </ThemedText>
            </View>
          ) : loadFailed ? (
            <View style={styles.center}>
              <ThemedText themeColor="textSecondary">
                スポットを取得できませんでした
              </ThemedText>
              <Pressable onPress={refresh} style={styles.retryButton}>
                <ThemedText type="smallBold" style={styles.retryLabel}>
                  再試行
                </ThemedText>
              </Pressable>
            </View>
          ) : viewMode === 'map' ? (
            <>
              <SpotsMap
                spots={filteredSpots}
                marks={marks}
                region={region}
                onRegionChange={setRegion}
                userCoords={location.coords}
                onSelectSpot={selectSpot}
                usingMapCenter={usingMapCenter}
              />
              {selectedSpot && (
                <SpotCard
                  spot={selectedSpot}
                  distanceKm={distanceKm(origin, spotLatLng(selectedSpot))}
                  mark={markOf(marks, selectedSpot.id)}
                  onChangeMark={(next) => changeMark(selectedSpot, next, 'map_card')}
                  onClose={() => setSelectedSpot(null)}
                />
              )}
            </>
          ) : (
            <>
              <View style={styles.listHeader}>
                <SortOriginToggle
                  value={sortOrigin}
                  onChange={changeSortOrigin}
                  currentLocationAvailable={currentLocationAvailable}
                />
                <ThemedText type="small" themeColor="textSecondary">
                  {spotListCountLabel(sortedItems.length, listMaxCount, listRadiusKm)}
                </ThemedText>
              </View>
              <SpotList
                items={sortedItems}
                marks={marks}
                onChangeMark={(spot, next) => changeMark(spot, next, 'list_row')}
              />
            </>
          )}
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
  heightFilterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  content: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  retryButton: {
    backgroundColor: '#208AEF',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  retryLabel: {
    color: '#ffffff',
  },
});
