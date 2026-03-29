import React, { useEffect } from 'react';
import { PostHogProvider as NativePostHogProvider, usePostHog } from 'posthog-react-native';
import { setPostHogClient } from './analytics';

const POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY ?? 'YOUR_POSTHOG_API_KEY';
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com';

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
  return (
    <NativePostHogProvider
      apiKey={POSTHOG_API_KEY}
      options={{
        host: POSTHOG_HOST,
        // Flush events every 30 s or when 20 events accumulate
        flushInterval: 30000,
        flushAt: 20,
        // Disable in dev to avoid polluting production data
        disabled: false,
        captureMode: 'form',
      }}
    >
      <PostHogClientBridge />
      {children}
    </NativePostHogProvider>
  );
}
