import type { SpotV1 } from '@/api/spots';

// クイック絞り込み: 1タップの固定条件。しきい値はtns-webのクイックフィルタと
// 数値・意味を揃える(風呂・標高はモバイル発の語彙)。詳細はCONTEXT.md参照
export type QuickFilterKey =
  | 'free'
  | 'toilet_near'
  | 'bath_near'
  | 'convenience_near'
  | 'high_elevation';

// 「◯◯200m以内」はWebのクイックフィルタと同じ数値
export const NearDistanceM = 200;
// 夏の暑さ対策(約-3℃)を意味する標高しきい値
export const MinElevationM = 500;

export const QuickFilterLabels: Record<QuickFilterKey, string> = {
  free: '無料',
  toilet_near: 'トイレ200m',
  bath_near: '風呂200m',
  convenience_near: 'コンビニ200m',
  high_elevation: '標高500m+',
};

export const AllQuickFilterKeys: QuickFilterKey[] = [
  'free',
  'toilet_near',
  'bath_near',
  'convenience_near',
  'high_elevation',
];

// 確認済み絞り込み: 距離系は「確認済みで条件内」だけを通し、距離不明は除外する。
// 「情報は隠さない」原則はデフォルト表示の話で、ユーザー自身の絞り込みは対象外
export const QuickFilterPredicates: Record<QuickFilterKey, (spot: SpotV1) => boolean> = {
  free: (spot) => spot.isFree,
  toilet_near: (spot) =>
    spot.distanceToToilet != null && spot.distanceToToilet <= NearDistanceM,
  bath_near: (spot) => spot.distanceToBath != null && spot.distanceToBath <= NearDistanceM,
  convenience_near: (spot) =>
    spot.distanceToConvenience != null && spot.distanceToConvenience <= NearDistanceM,
  high_elevation: (spot) => spot.elevation >= MinElevationM,
};
