import type { SpotType } from '@/api/spots';

// ラベルはtns-web(CampingSpotTypeLabels)と揃える
export const SpotTypeLabels: Record<SpotType, string> = {
  roadside_station: '道の駅・◯◯の駅',
  sa_pa: 'SA/PA',
  rv_park: 'RVパーク',
  auto_campground: 'オートキャンプ場',
  onsen_facility: '日帰り温泉施設',
  convenience_store: 'コンビニ',
  parking_lot: '駐車場',
  other: 'その他',
};

// フィルタチップ・バッジ用の短縮形
export const SpotTypeShortLabels: Record<SpotType, string> = {
  roadside_station: '道の駅',
  sa_pa: 'SA/PA',
  rv_park: 'RVパーク',
  auto_campground: 'オートキャンプ場',
  onsen_facility: '日帰り温泉',
  convenience_store: 'コンビニ',
  parking_lot: '駐車場',
  other: 'その他',
};

export const SpotTypeColors: Record<SpotType, string> = {
  roadside_station: '#2E7D32',
  sa_pa: '#1565C0',
  rv_park: '#6A1B9A',
  auto_campground: '#EF6C00',
  onsen_facility: '#C2185B',
  convenience_store: '#00838F',
  parking_lot: '#546E7A',
  other: '#757575',
};

// 車中泊禁止スポットのマーカー色(同列表示しつつ灰色系で区別する)
export const ProhibitedMarkerColor = '#9E9E9E';

export const AllSpotTypes: SpotType[] = [
  'roadside_station',
  'sa_pa',
  'rv_park',
  'auto_campground',
  'onsen_facility',
  'convenience_store',
  'parking_lot',
  'other',
];
