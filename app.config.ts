import type { ConfigContext, ExpoConfig } from 'expo/config';

// app.jsonを基礎とし、ビルド環境の環境変数だけをここで注入する。
// GOOGLE_MAPS_ANDROID_API_KEY はAndroidの本番ビルドで必須(未設定だと地図が空白になる)。
// Expo Goでの開発では不要。
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  plugins: [
    ...(config.plugins ?? []),
    [
      'react-native-maps',
      {
        androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY ?? '',
      },
    ],
  ],
});
