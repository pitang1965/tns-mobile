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

// 診断は運営者情報とは性格が違う「プロダクトへ引き込むコンテンツ」なので、
// リストに混ぜず上部の独立カードとして目立たせる
const shindan = {
  target: 'shindan' as const,
  label: '車中泊スタイル診断',
  description: '10問であなたに合う場所が見つかる',
  url: `${WEB_BASE_URL}/shachu-haku/shindan?utm_source=app&utm_medium=info`,
};

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
    label: '車旅のしおり(Webサイト)',
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

      <Pressable
        onPress={() => openLink(shindan)}
        accessibilityRole="link"
        style={[styles.shindanCard, { backgroundColor: theme.backgroundSelected }]}
      >
        <View style={styles.shindanText}>
          <ThemedText type="smallBold">{shindan.label}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {shindan.description}
          </ThemedText>
        </View>
        <ThemedText themeColor="textSecondary">↗</ThemedText>
      </Pressable>

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
  shindanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  shindanText: {
    gap: Spacing.half,
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
