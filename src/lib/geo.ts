export type LatLng = {
  latitude: number;
  longitude: number;
};

const EARTH_RADIUS_KM = 6371;

// 直線距離(ハバーサイン)。「近い順」の定義はこの直線距離とする
export function distanceKm(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * sinLng * sinLng;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export function formatDistanceKm(km: number): string {
  if (km < 10) {
    return `${km.toFixed(1)}km`;
  }
  return `${Math.round(km)}km`;
}

// 周辺施設(トイレ・コンビニ・入浴)までの距離。
// null は「不明」で「―」、0 は「敷地内にあるが場所不明」で「敷地内」と出し分ける
// (0m と表示すると距離0のバグに見えるため。意味の詳細はCONTEXT.md参照)
export function formatFacilityDistance(meters: number | undefined): string {
  if (meters == null) {
    return '―';
  }
  if (meters === 0) {
    return '敷地内';
  }
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}
