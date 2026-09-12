/* eslint-env node */

module.exports = ({ config }) => {
  const IS_DEV = process.env.APP_VARIANT === 'development';

  return {
    ...config,
    name: IS_DEV ? 'KrishiSahayak (Dev)' : 'KrishiSahayak',
    slug: 'mobile',

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
      'expo-localization',
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
          icon: './assets/images/notification-icon.png',
          color: '#2D7A3A',
        },
      ],
    ],

    extra: {
      eas: {
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID ?? '',
      },
      posthogProjectToken: process.env.EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN,
      posthogHost: process.env.EXPO_PUBLIC_POSTHOG_HOST,
    },
  };
};