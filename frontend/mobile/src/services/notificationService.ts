import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

/**
 * Registers the device for push notifications and stores the
 * Expo push token in Supabase `push_tokens` table.
 *
 * Requires: expo-notifications  (npx expo install expo-notifications)
 * Requires: expo-device         (npx expo install expo-device)
 *
 * Call once after user signs in.
 */
export async function registerForPushNotifications(userId: string): Promise<string | null> {
  try {
    const Device       = require('expo-device');
    const Notifications = require('expo-notifications');

    // Physical device only — simulators can't receive pushes
    if (!Device.isDevice) {
      console.warn('[PushNotif] Skipped — not a physical device');
      return null;
    }

    // Request permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[PushNotif] Permission denied');
      return null;
    }

    // Get Expo push token
    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    });

    // Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('price-alerts', {
        name:       'Price Alerts',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2D7A3A',
        sound:      'default',
      });
    }

    // Upsert token in Supabase (ignore duplicates)
    const { error } = await supabase.from('push_tokens').upsert(
      {
        user_id:  userId,
        token,
        platform: Platform.OS,
      },
      { onConflict: 'user_id,token' }
    );

    if (error) console.error('[PushNotif] Supabase upsert error:', error.message);

    return token;
  } catch (err) {
    // expo-notifications not installed — silently skip in dev
    console.warn('[PushNotif] expo-notifications not available:', err);
    return null;
  }
}

/**
 * Configure how notifications appear when the app is foregrounded.
 * Call at app root, before rendering.
 */
export function configureNotificationHandler(): void {
  try {
    const Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge:  false,
      }),
    });
  } catch {
    // expo-notifications not installed
  }
}
