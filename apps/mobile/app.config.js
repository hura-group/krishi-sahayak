// app.config.js — dynamic config that reads from .env
// This file takes precedence over app.json for any keys it exports.
// Run: npx expo start   (Expo automatically picks this up)

const IS_DEV = process.env.APP_VARIANT === 'development';

export default ({ config }) => ({
  ...config,
  name:   IS_DEV ? 'KrishiSahayak (Dev)' : 'KrishiSahayak',
  slug:   'mobile',

  ios: {
    ...config.ios,
    bundleIdentifier: IS_DEV
      ? 'com.huragroup.krishisahayak.dev'
      : 'com.huragroup.krishisahayak',
    config: {
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? '',
    },
  },

  android: {
    ...config.android,
    package: IS_DEV
      ? 'com.huragroup.krishisahayak.dev'
      : 'com.huragroup.krishisahayak',
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY ?? '',
      },
    },
  },

  plugins: [
    ...(config.plugins ?? []),
    [
      'react-native-maps',
      {
        // Forces PROVIDER_GOOGLE on Android (enables satellite & traffic layers)
        useGoogleMapsOnAndroid: true,
      },
    ],
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission:
          'Allow KrishiSahayak to access your location to find nearby mandis and personalise market prices.',
      },
    ],
    [
      'expo-notifications',
      {
        icon:  './assets/images/notification-icon.png',
        color: '#2D7A3A',
        // Android channel created by notificationService.ts at runtime
      },
    ],
  ],

  extra: {
    eas: {
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID ?? '',
    },
  },
});
