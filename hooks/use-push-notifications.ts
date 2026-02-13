import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { pushNotificationService } from '@/services/pushNotification.service';
import { useStore } from '@/store';

// Configure handler for displaying notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface PushNotificationData {
  type?: 'message' | 'emergency' | 'event' | string;
  conversationId?: string;
  messageId?: string;
  senderId?: string;
  eventId?: string;
  deepLink?: string;
  [key: string]: any;
}

interface UsePushNotificationsReturn {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  registerToken: () => Promise<void>;
  unregisterToken: () => Promise<void>;
}

export function usePushNotifications(
  onNotificationClick?: (data: PushNotificationData) => void
): UsePushNotificationsReturn {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined);
  const isLoggedIn = useStore((state) => state.isLoggedIn);

  // Get token and set up listeners
  useEffect(() => {
    if (!isLoggedIn) {
      // If user is not logged in, clean up listeners
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
      notificationListener.current = undefined;
      responseListener.current = undefined;
      return;
    }

    registerForPushNotificationsAsync()
      .then(async (token) => {
        if (token) {
          setExpoPushToken(token);
          // Store token in AsyncStorage for access during logout
          await AsyncStorage.setItem('expo_push_token', token);
        }
      })
      .catch((error) => {
        console.error('Error registering for push notifications:', error);
      });

    // Listen to received notifications (when app is open)
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
        handleNotificationReceived(notification);
      });

    // Listen to notification clicks
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        handleNotificationResponse(response, onNotificationClick);
      });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [isLoggedIn, onNotificationClick]);

  // Register token on server
  const registerToken = async (): Promise<void> => {
    if (!expoPushToken || !isLoggedIn) {
      return;
    }

    try {
      const deviceId = await getDeviceId();
      const deviceName = Device.deviceName || Device.modelName || 'Unknown Device';
      const platform = Platform.OS as 'ios' | 'android' | 'web';

      await pushNotificationService.registerToken({
        token: expoPushToken,
        deviceId,
        deviceName,
        platform,
      });

      console.log('✅ Token registered successfully');
    } catch (error: any) {
      console.error('Error registering token:', error);
      if (error.status === 401) {
        Alert.alert('Error', 'Please login again');
      }
    }
  };

  // Unregister token from server
  const unregisterToken = async (): Promise<void> => {
    // Try to get token from state or AsyncStorage
    let tokenToUnregister = expoPushToken;
    if (!tokenToUnregister) {
      tokenToUnregister = await AsyncStorage.getItem('expo_push_token');
    }

    if (!tokenToUnregister || !isLoggedIn) {
      return;
    }

    try {
      await pushNotificationService.unregisterToken(tokenToUnregister);
      console.log('✅ Token unregistered successfully');
      setExpoPushToken(null);
      await AsyncStorage.removeItem('expo_push_token');
      // Clear badge count
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error('Error unregistering token:', error);
      // Still clear local token even if API call fails
      setExpoPushToken(null);
      await AsyncStorage.removeItem('expo_push_token');
    }
  };

  // Auto-register token when token is ready and user is logged in
  useEffect(() => {
    if (expoPushToken && isLoggedIn) {
      registerToken();
    }
  }, [expoPushToken, isLoggedIn]);

  return {
    expoPushToken,
    notification,
    registerToken,
    unregisterToken,
  };
}

/**
 * Request permissions and get Expo Push Token
 */
async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  // Only works on real devices
  if (!Device.isDevice) {
    if (__DEV__) {
      console.warn(
        '⚠️ Push Notifications only work on real devices, not on simulators'
      );
    }
    return null;
  }

  // Configure channels for Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
    });

    // Channel for messages
    await Notifications.setNotificationChannelAsync('messages', {
      name: 'Messages',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    });

    // Channel for emergency messages
    await Notifications.setNotificationChannelAsync('emergency', {
      name: 'Emergency',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 500, 500],
      sound: 'default',
    });
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permission if we don't have it
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  // If permission was not granted
  if (finalStatus !== 'granted') {
    if (__DEV__) {
      Alert.alert(
        'Permission Required',
        'To receive notifications, you must grant the necessary permission'
      );
    }
    return null;
  }

  // Get Expo Push Token
  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      throw new Error(
        'Project ID not found. Please set it in app.json:\n' +
          '{\n' +
          '  "expo": {\n' +
          '    "extra": {\n' +
          '      "eas": {\n' +
          '        "projectId": "your-project-id"\n' +
          '      }\n' +
          '    }\n' +
          '  }\n' +
          '}'
      );
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    token = tokenData.data;
    console.log('✅ Expo Push Token received:', token);
  } catch (error) {
    console.error('❌ Error getting Expo Push Token:', error);
    if (__DEV__) {
      Alert.alert('Error', 'Failed to get token');
    }
  }

  return token;
}

/**
 * Get unique Device ID
 */
async function getDeviceId(): Promise<string> {
  // Use modelId or create a UUID
  const deviceId =
    Device.modelId ||
    Device.osInternalBuildId ||
    `${Platform.OS}-${Date.now()}`;
  return deviceId;
}

/**
 * Handle received notification (when app is open)
 */
function handleNotificationReceived(
  notification: Notifications.Notification
): void {
  const data = notification.request.content.data as PushNotificationData;
  console.log('📬 Notification received:', {
    title: notification.request.content.title,
    body: notification.request.content.body,
    data,
  });

  // You can add your custom logic here
  // For example, show a toast or update state
}

/**
 * Handle notification click
 */
function handleNotificationResponse(
  response: Notifications.NotificationResponse,
  onNotificationClick?: (data: PushNotificationData) => void
): void {
  const data = response.notification.request.content.data as PushNotificationData;
  console.log('👆 Notification clicked:', data);

  // Call callback if defined
  if (onNotificationClick) {
    onNotificationClick(data);
  }
}
