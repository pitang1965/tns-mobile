import PostHog from 'posthog-react-native';

import type { SpotType, SpotV1 } from '@/api/spots';
import type { QuickFilterKey } from '@/constants/quick-filters';

const apiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
const host = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

// キー未設定(ローカル開発など)では計測を無効化し、アプリは通常動作させる
export const posthog: PostHog | null = apiKey
  ? new PostHog(apiKey, { host, captureAppLifecycleEvents: true })
  : null;

export type ReferralOrigin = 'list_row' | 'map_card';

type SpotEventProps = {
  spot_id: string;
  spot_type: SpotType;
  prefecture: string;
  distance_km: number | null;
  is_overnight_prohibited: boolean;
};

type AnalyticsEvent =
  | { name: 'view_mode_changed'; properties: { mode: 'map' | 'list' } }
  | {
      name: 'filter_changed';
      properties: { types: SpotType[]; quick: QuickFilterKey[] };
    }
  | { name: 'spot_card_opened'; properties: SpotEventProps }
  | {
      name: 'spot_web_referral';
      properties: SpotEventProps & { origin: ReferralOrigin };
    }
  | { name: 'location_permission_result'; properties: { granted: boolean } };

export function track(event: AnalyticsEvent): void {
  posthog?.capture(event.name, event.properties);
}

export function spotEventProps(
  spot: SpotV1,
  distanceKm: number | null,
): SpotEventProps {
  return {
    spot_id: spot.id,
    spot_type: spot.type,
    prefecture: spot.prefecture,
    distance_km: distanceKm == null ? null : Math.round(distanceKm * 10) / 10,
    is_overnight_prohibited: spot.isOvernightProhibited,
  };
}
