/**
 * Push notification registration for Expo.
 * Call registerForPushNotifications() once after login.
 * The returned token is saved to the user's habit records so the backend
 * can send nudges via Expo Push.
 */
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { apiRequest } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    // Push notifications don't work in simulators — skip silently
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('habitheal', {
      name: 'HabitHeal Nudges',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  return token;
}

export async function saveTokenToBackend(
  token: string,
  habitIds: string[]
): Promise<void> {
  // Update each active habit with the push token
  await Promise.allSettled(
    habitIds.map((id) =>
      apiRequest(`/habits/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ expo_push_token: token }),
      })
    )
  );
}
