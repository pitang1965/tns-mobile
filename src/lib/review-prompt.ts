import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import { AppState } from 'react-native';

import { track, type ReviewPromptTrigger } from '@/analytics/analytics';

// レビュー依頼: 「ちゃんと使っている人」にだけ、前向きな瞬間にストア評価を求める(CONTEXT.md)。
// 満足度を先に尋ねて振り分けることはしない(Googleの規約)。表示するかはGoogleが決める
const REFERRAL_COUNT_KEY = 'review-referral-count-v1';
const MARK_PROMPTED_KEY = 'review-mark-prompted-v1';
const REFERRAL_THRESHOLDS = [10, 30];
const MARK_THRESHOLD = 3;

async function requestReview(trigger: ReviewPromptTrigger): Promise<void> {
  if (!(await StoreReview.isAvailableAsync())) {
    return;
  }
  track({ name: 'review_prompt_requested', properties: { trigger } });
  await StoreReview.requestReview();
}

// Android の openBrowserAsync はブラウザを閉じるのを待たないため、アプリが前面に戻ったときに出す
function onNextReturn(fn: () => void): void {
  const sub = AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      sub.remove();
      fn();
    }
  });
}

// Web誘導の直前に呼ぶ。回数は端末内だけで数える(この機能の入った版から数え始める)
export async function countReferralForReview(): Promise<void> {
  try {
    const count = Number((await AsyncStorage.getItem(REFERRAL_COUNT_KEY)) ?? '0') + 1;
    await AsyncStorage.setItem(REFERRAL_COUNT_KEY, String(count));
    if (REFERRAL_THRESHOLDS.includes(count)) {
      onNextReturn(() => {
        requestReview(`referral_${count}` as ReviewPromptTrigger).catch(() => {});
      });
    }
  } catch {
    // 依頼できなくても致命的ではない
  }
}

// 印を付けた直後に呼ぶ。すでに3件以上付けていた人にも届くよう「ちょうど3件」ではなく「3件以上」
export async function maybeRequestReviewForMarks(markedCount: number): Promise<void> {
  if (markedCount < MARK_THRESHOLD) {
    return;
  }
  try {
    if (await AsyncStorage.getItem(MARK_PROMPTED_KEY)) {
      return;
    }
    await AsyncStorage.setItem(MARK_PROMPTED_KEY, '1');
    await requestReview('mark_3');
  } catch {
    // 依頼できなくても致命的ではない
  }
}
