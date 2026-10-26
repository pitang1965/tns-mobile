// /api/v1 はtns-web側が保証する公開契約(tns-web docs/adr/0006-versioned-mobile-api.md)。
// SpotV1の形はサーバー実装(src/app/api/v1/spots/route.ts)と一致させること。

export type SpotType =
  | 'roadside_station'
  | 'sa_pa'
  | 'rv_park'
  | 'auto_campground'
  | 'onsen_facility'
  | 'convenience_store'
  | 'parking_lot'
  | 'other';

export type SpotV1 = {
  id: string;
  name: string;
  type: SpotType;
  coordinates: [number, number]; // [lng, lat]
  prefecture: string;
  isFree: boolean;
  pricePerNight?: number;
  isOvernightProhibited: boolean;
  elevation: number; // meters
  distanceToToilet?: number; // meters(欠損あり。表示・絞り込みとも欠損前提で扱う)
  distanceToConvenience?: number; // meters
  distanceToBath?: number; // meters
  maxVehicleHeight?: number; // 全高制限(cm)。値なし=不明。車高フィルタで使用
  noHeightLimit?: boolean; // true=高さ制限なし確定。maxVehicleHeightより優先して「入れる側」
  heightLimitCaution?: boolean; // true=要注意(区画差・入口の低い梁など)。バッジ表示用
};

export type SpotsV1Response = {
  version: 1;
  generatedAt: string;
  spots: SpotV1[];
};

export const WEB_BASE_URL = 'https://tabi.over40web.club';

export const SPOTS_API_URL = `${WEB_BASE_URL}/api/v1/spots`;

// アプリに埋め込む固定APIキー。バンドルから抽出可能なため本物の認証ではなく、
// 匿名・野良アクセスを弾くための段差。サーバー(tns-web)側の SPOTS_API_KEY と
// 同じ値を設定する。EXPO_PUBLIC_ 接頭辞によりビルド時にバンドルへ展開される。
// 未設定(ローカル開発など)ならヘッダー無しで送る。
const SPOTS_API_KEY = process.env.EXPO_PUBLIC_SPOTS_API_KEY;

// タイムアウト無しだと、接続はできるが応答が返らない回線で読み込み中のまま
// 固まる(再試行ボタンはfetchが失敗するまで出せない)。10秒で打ち切り、
// 既存の失敗時フォールバック(キャッシュ表示・再試行導線)に合流させる
const FETCH_TIMEOUT_MS = 10_000;

export async function fetchSpots(): Promise<SpotsV1Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(SPOTS_API_URL, {
      headers: SPOTS_API_KEY ? { 'x-api-key': SPOTS_API_KEY } : undefined,
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`spots API failed: ${res.status}`);
    }
    return (await res.json()) as SpotsV1Response;
  } finally {
    clearTimeout(timeout);
  }
}

// Web誘導先。アプリ内に詳細画面は作らない(誘導ファネル設計)
export function spotWebUrl(spotId: string): string {
  return `${WEB_BASE_URL}/shachu-haku/${spotId}?utm_source=app&utm_medium=referral`;
}
