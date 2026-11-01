import * as WebBrowser from 'expo-web-browser';

import { spotEventProps, track, type ReferralOrigin } from '@/analytics/analytics';
import { spotWebUrl, type SpotV1 } from '@/api/spots';
import { countReferralForReview } from '@/lib/review-prompt';

// Web誘導: 外部ブラウザ(iOS: SFSafariViewController / Android: Custom Tabs)で
// Webの詳細ページを開く。本アプリ唯一の成果地点
export async function openSpotWeb(
  spot: SpotV1,
  origin: ReferralOrigin,
  distanceKm: number | null,
): Promise<void> {
  track({
    name: 'spot_web_referral',
    properties: { ...spotEventProps(spot, distanceKm), origin },
  });
  await WebBrowser.openBrowserAsync(spotWebUrl(spot.id));
  // 開けたときだけ数える(失敗時にレビュー依頼の待ち受けが残り、無関係な瞬間に出るのを防ぐ)。
  // shortcut: iOS は閉じた後に解決するため戻りを検知できない、iOSネイティブ対応時に見直す
  await countReferralForReview();
}
