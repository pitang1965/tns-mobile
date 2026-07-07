import * as WebBrowser from 'expo-web-browser';

import { spotEventProps, track, type ReferralOrigin } from '@/analytics/analytics';
import { spotWebUrl, type SpotV1 } from '@/api/spots';

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
}
