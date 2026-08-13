import type { SpotV1 } from '@/api/spots';

// 車高フィルタの設定値。tns-web の ClientSideFilterValues と数値・意味を揃える。
// vehicleHeight は自車の全高(cm)。null=フィルタ無効。
export type VehicleHeightSettings = {
  vehicleHeight: number | null;
  includeUnknownHeight: boolean;
};

export const DefaultVehicleHeightSettings: VehicleHeightSettings = {
  vehicleHeight: null,
  includeUnknownHeight: true,
};

// 入力文字列を車高(cm)に正規化する。空・不正・0以下は null(=フィルタ解除)。
export function parseVehicleHeightCm(input: string): number | null {
  const trimmed = input.trim();
  const num = Number(trimmed);
  if (trimmed === '' || !Number.isFinite(num) || num <= 0) {
    return null;
  }
  return Math.round(num);
}

// スポットが車高フィルタを通過するか。tns-web の filterSpotsClientSide と同一ロジック:
// - vehicleHeight 未設定 → フィルタ無効で常に通過
// - noHeightLimit(制限なし確定) → 常に通過
// - maxVehicleHeight(数値) → 自車高「以下」なら除外(制限==車高も安全側で除外)
// - どちらもなし(不明) → includeUnknownHeight が false のとき除外
export function spotPassesHeightFilter(
  spot: SpotV1,
  settings: VehicleHeightSettings,
): boolean {
  if (settings.vehicleHeight == null) {
    return true;
  }
  if (spot.noHeightLimit) {
    return true;
  }
  if (spot.maxVehicleHeight != null) {
    return spot.maxVehicleHeight > settings.vehicleHeight;
  }
  return settings.includeUnknownHeight;
}
