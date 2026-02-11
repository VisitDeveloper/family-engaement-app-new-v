import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { pushNotificationService } from '@/services/pushNotification.service';

/**
 * Unregister push notification token during logout
 * This function can be called from anywhere, including logout handlers
 */
export async function unregisterPushTokenOnLogout(): Promise<void> {
  try {
    const token = await AsyncStorage.getItem('expo_push_token');
    if (token) {
      try {
        await pushNotificationService.unregisterToken(token);
        console.log('✅ Push token unregistered on logout');
      } catch (error) {
        console.error('Error unregistering push token:', error);
        // Continue even if API call fails
      }
      await AsyncStorage.removeItem('expo_push_token');
    }

    // Clear badge count
    await Notifications.setBadgeCountAsync(0);
  } catch (error) {
    console.error('Error in unregisterPushTokenOnLogout:', error);
  }
}
