import Constants from 'expo-constants';
import React, { useEffect } from 'react';
import { PostHogProvider as NativePostHogProvider, usePostHog } from 'posthog-react-native';
import { setPostHogClient } from './analytics';

const POSTHOG_PROJECT_TOKEN = Constants.expoConfig?.extra?.posthogProjectToken as string | undefined;
const POSTHOG_HOST = Constants.expoConfig?.extra?.posthogHost as string | undefined;

// Inner component that wires up the singleton client
function PostHogClientBridge() {
  const posthog = usePostHog();

  useEffect(() => {
    if (posthog) {
      setPostHogClient(posthog);
      if (__DEV__) console.log('[Analytics] PostHog client ready');
    }
  }, [posthog]);

  return null;
}

interface Props {
  children: React.ReactNode;
}

/**
 * Wrap your app root with this provider.
 *
 * @example
 * // app/_layout.tsx
 * import { PostHogProvider } from '@/src/analytics/PostHogProvider';
 *
 * export default function RootLayout() {
 *   return (
 *     <PostHogProvider>
 *       <Stack />
 *     </PostHogProvider>
 *   );
 * }
 */
export function PostHogProvider({ children }: Props) {
  if (!POSTHOG_PROJECT_TOKEN || !POSTHOG_HOST) {
    if (__DEV__) {
      const missingVariable = !POSTHOG_PROJECT_TOKEN
        ? 'EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN'
        : 'EXPO_PUBLIC_POSTHOG_HOST';
      throw new Error(
        `${missingVariable} variable required by PostHog is missing or un-configured, ` +
        `this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`
      );
    }
    return <>{children}</>;
  }

  return (
    <NativePostHogProvider
      apiKey={POSTHOG_PROJECT_TOKEN}
      options={{
        host: POSTHOG_HOST,
        // Flush events every 30 s or when 20 events accumulate
        flushInterval: 30000,
        flushAt: 20,
      }}
    >
      <PostHogClientBridge />
      {children}
    </NativePostHogProvider>
  );
}
