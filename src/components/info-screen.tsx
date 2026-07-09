import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { track, type InfoLinkTarget } from '@/analytics/analytics';
import { WEB_BASE_URL } from '@/api/spots';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// 情報タブ: 運営者情報への静的リンク集。お知らせを含め本文はアプリ内に持たずWebに委ねる。
// ここからのWeb閲覧はスポット詳細への誘導ではないため、Web誘導(spot_web_referral)には数えない

// 診断・投稿は運営者情報とは性格が違う「行動を促すCTA」なので、
// リストに混ぜず上部の独立カードとして目立たせる(診断=引き込む/投稿=貢献)
type FeatureCard = {
  target: InfoLinkTarget;
  label: string;
  description: string;
  url: string;
};

const featureCards: FeatureCard[] = [
  {
    target: 'shindan',
    label: '車中泊スタイル診断',
    description: '10問であなたに合う場所が見つかる',
    url: `${WEB_BASE_URL}/shachu-haku/shindan?utm_source=app&utm_medium=info`,
  },
  {
    target: 'submit',
    label: '車中泊スポット情報の投稿',
    description: '知っている場所を教えてください',
    url: `${WEB_BASE_URL}/shachu-haku/submit?utm_source=app&utm_medium=info`,
  },
];

const links: { target: InfoLinkTarget; label: string; url: string }[] = [
  {
    target: 'updates',
    label: 'お知らせ(更新情報)',
    url: `${WEB_BASE_URL}/updates?utm_source=app&utm_medium=info`,
  },
  {
    target: 'privacy_policy',
    label: 'プライバシーポリシー',
    url: `${WEB_BASE_URL}/privacy/app`,
  },
  {
    target: 'contact',
    label: 'お問い合わせ',
    url: `${WEB_BASE_URL}/contact`,
  },
  {
    target: 'website',
    label: '車旅のしおり トップページ',
    url: `${WEB_BASE_URL}/?utm_source=app&utm_medium=info`,
  },
];

async function openLink(link: {
  target: InfoLinkTarget;
  url: string;
}): Promise<void> {
  track({ name: 'info_link_opened', properties: { target: link.target } });
  await WebBrowser.openBrowserAsync(link.url);
}

export function InfoScreen() {
  const theme = useTheme();
  const version = Constants.expoConfig?.version;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.appMeta}>
        <ThemedText type="smallBold">車中泊スポットマップ</ThemedText>
        {version && (
          <ThemedText type="small" themeColor="textSecondary">
            バージョン {version}
          </ThemedText>
        )}
      </View>

      <View style={styles.featureGroup}>
        {featureCards.map((card) => (
          <Pressable
            key={card.target}
            onPress={() => openLink(card)}
            accessibilityRole="link"
            style={[styles.featureCard, { backgroundColor: theme.backgroundSelected }]}
          >
            <View style={styles.featureText}>
              <ThemedText type="smallBold">{card.label}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {card.description}
              </ThemedText>
            </View>
            <ThemedText themeColor="textSecondary">↗</ThemedText>
          </Pressable>
        ))}
      </View>

      <View style={[styles.linkGroup, { backgroundColor: theme.backgroundElement }]}>
        {links.map((link, index) => (
          <Pressable
            key={link.target}
            onPress={() => openLink(link)}
            accessibilityRole="link"
            style={[
              styles.row,
              index > 0 && {
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: theme.backgroundSelected,
              },
            ]}
          >
            <ThemedText>{link.label}</ThemedText>
            <ThemedText themeColor="textSecondary">↗</ThemedText>
          </Pressable>
        ))}
      </View>

      <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
        スポットの詳細情報はWebサイト「車旅のしおり」で提供しています。
      </ThemedText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.four,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  appMeta: {
    alignItems: 'center',
    gap: Spacing.one,
    paddingTop: Spacing.three,
  },
  featureGroup: {
    gap: Spacing.two,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  featureText: {
    gap: Spacing.half,
    flexShrink: 1,
  },
  linkGroup: {
    borderRadius: Spacing.two,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  note: {
    textAlign: 'center',
  },
});
