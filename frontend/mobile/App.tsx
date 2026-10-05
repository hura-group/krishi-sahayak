import React from 'react';
import { ExpoRoot } from 'expo-router';
import { PostHogProvider, usePostHog } from 'posthog-react-native';
import { setPostHogInstance } from './src/utils/analytics';

function PostHogSetup(): null {
  const posthog = usePostHog();
  React.useEffect(() => {
    if (posthog) {
      setPostHogInstance(posthog);
    }
  }, [posthog]);
  return null;
}

export default function App() {
  // @ts-ignore
  const ctx = require.context('./app');
  
  return (
    <PostHogProvider
      apiKey={process.env.EXPO_PUBLIC_POSTHOG_KEY ?? ''}
      options={{
        host: process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
        captureAppLifecycleEvents: true,
      }}
    >
      <PostHogSetup />
      <ExpoRoot context={ctx} />
    </PostHogProvider>
  );
}