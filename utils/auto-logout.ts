import { useStore } from "@/store";
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * تابع برای logout خودکار در صورت خطای 401
 * این تابع token را پاک می‌کند و state را به‌روزرسانی می‌کند
 */
export async function performAutoLogout(): Promise<void> {
  try {
    // پاک کردن token ها از storage (استفاده مستقیم از AsyncStorage برای جلوگیری از circular dependency)
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('refresh_token');

    // به‌روزرسانی state - استفاده از getState برای دسترسی مستقیم
    const store = useStore.getState();
    store.setLoggedIn(false);
    store.setRole(null);
    store.setUser(null);

    console.log("Auto logout performed due to unauthorized error");
  } catch (error) {
    console.error("Error during auto logout:", error);
    // حتی اگر خطا رخ دهد، سعی می‌کنیم state را پاک کنیم
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

