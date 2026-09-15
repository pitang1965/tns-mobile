import type { SpotV1 } from '@/api/spots';
import { isWantToVisit, markOf, type SpotMarks } from '@/constants/spot-marks';

// クイック絞り込み: 1タップの固定条件。しきい値はtns-webのクイックフィルタと
// 数値・意味を揃える(風呂・標高はモバイル発の語彙)。詳細はCONTEXT.md参照
export type QuickFilterKey =
  | 'want_to_visit'
  | 'free'
  | 'toilet_near'
  | 'bath_near'
  | 'convenience_near'
  | 'high_elevation';

// 設備ごとの「◯m以内」しきい値。徒歩負担の許容度が施設ごとに異なるため個別に持つ。
// トイレは深夜に長距離を歩くと目が覚める負担を考え300m(Web詳細フィルタの最大値)。
// コンビニも同様に300m。風呂は湯冷めを避けたい一方で車移動前提の利用も多く、
// 徒歩圏より広めの1000mまで許容する。Webのクイックチップとは意図的にズレる
export const ToiletNearDistanceM = 300;
export const ConvenienceNearDistanceM = 300;
export const BathNearDistanceM = 1000;
// 夏の暑さ対策(約-3℃)を意味する標高しきい値
export const MinElevationM = 500;

export const QuickFilterLabels: Record<QuickFilterKey, string> = {
  want_to_visit: '♡ 行きたい',
  free: '無料',
  toilet_near: 'トイレ300m以内',
  bath_near: '風呂1km以内',
  convenience_near: 'コンビニ300m以内',
  high_elevation: '標高500m以上',
};

export const AllQuickFilterKeys: QuickFilterKey[] = [
  'want_to_visit',
  'free',
  'toilet_near',
  'bath_near',
  'convenience_near',
  'high_elevation',
];

// 確認済み絞り込み: 距離系は「確認済みで条件内」だけを通し、距離不明は除外する。
// 「情報は隠さない」原則はデフォルト表示の話で、ユーザー自身の絞り込みは対象外。
// 「行きたい」だけはスポットの属性ではなくユーザーが付けた印に対する条件
// (「また行きたい」も含む)
export const QuickFilterPredicates: Record<
  QuickFilterKey,
  (spot: SpotV1, marks: SpotMarks) => boolean
> = {
  want_to_visit: (spot, marks) => isWantToVisit(markOf(marks, spot.id)),
  free: (spot) => spot.isFree,
  toilet_near: (spot) =>
    spot.distanceToToilet != null && spot.distanceToToilet <= ToiletNearDistanceM,
  bath_near: (spot) =>
    spot.distanceToBath != null && spot.distanceToBath <= BathNearDistanceM,
  convenience_near: (spot) =>
    spot.distanceToConvenience != null &&
    spot.distanceToConvenience <= ConvenienceNearDistanceM,
  high_elevation: (spot) => spot.elevation >= MinElevationM,
};
