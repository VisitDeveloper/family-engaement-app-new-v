import { useStore } from "@/store";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { unregisterPushTokenOnLogout } from "./pushNotifications";

/**
 * Function for automatic logout in case of 401 error
 * This function clears tokens and updates the state
 */
export async function performAutoLogout(): Promise<void> {
  try {
    // Unregister push notification token
    await unregisterPushTokenOnLogout();

    // Clear tokens from storage (using AsyncStorage directly to avoid circular dependency)
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('refresh_token');

    // Update state - using getState for direct access
    const store = useStore.getState();
    store.setLoggedIn(false);
    store.setRole(null);
    store.setUser(null);

    console.log("Auto logout performed due to unauthorized error");
  } catch (error) {
    console.error("Error during auto logout:", error);
    // Even if an error occurs, we try to clear the state
    try {
      const store = useStore.getState();
      store.setLoggedIn(false);
      store.setRole(null);
      store.setUser(null);
    } catch (stateError) {
      console.error("Error clearing state:", stateError);
    }
  }
}

