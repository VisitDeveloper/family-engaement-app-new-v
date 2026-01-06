import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

let cachedIpAddress: string | null = null;

/**
 * Gets the device's local IP address
 * @returns Promise<string | null> The IP address or null if unavailable
 */
export async function getLocalIpAddress(): Promise<string | null> {
  try {
    // Return cached IP if available
    if (cachedIpAddress) {
      return cachedIpAddress;
    }

    let ipAddress: string | null = null;
    
    // Method 1: Try to get IP from Expo Constants (dev server IP)
    // In development, Expo provides the dev server IP in Constants
    try {
      const expoConfig = Constants.expoConfig;
      
      // Check hostUri (works on both iOS and Android)
      if (expoConfig?.hostUri) {
        // hostUri format: "192.168.1.100:8081"
        const hostUri = expoConfig.hostUri;
        const ipMatch = hostUri.match(/^(\d+\.\d+\.\d+\.\d+)/);
        if (ipMatch && ipMatch[1]) {
          ipAddress = ipMatch[1];
        }
      }
      
      // Also check debuggerHost (alternative property)
      if (!ipAddress && (expoConfig as any)?.debuggerHost) {
        const debuggerHost = (expoConfig as any).debuggerHost;
        const ipMatch = debuggerHost.match(/^(\d+\.\d+\.\d+\.\d+)/);
        if (ipMatch && ipMatch[1]) {
          ipAddress = ipMatch[1];
        }
      }

      // For Android, also check manifest2 properties and legacy manifest
      if (!ipAddress && Platform.OS === 'android') {
        // Check manifest2
        const manifest2 = Constants.manifest2 as any;
        if (manifest2?.extra?.expoGo?.debuggerHost) {
          const debuggerHost = manifest2.extra.expoGo.debuggerHost;
          const ipMatch = debuggerHost.match(/^(\d+\.\d+\.\d+\.\d+)/);
          if (ipMatch && ipMatch[1]) {
            ipAddress = ipMatch[1];
          }
        }
        
        // Check legacy manifest hostUri
        if (!ipAddress && Constants.manifest?.hostUri) {
          const hostUri = Constants.manifest.hostUri;
          const ipMatch = hostUri.match(/^(\d+\.\d+\.\d+\.\d+)/);
          if (ipMatch && ipMatch[1]) {
            ipAddress = ipMatch[1];
          }
        }
        
        // Check legacy manifest debuggerHost
        if (!ipAddress && (Constants.manifest as any)?.debuggerHost) {
          const debuggerHost = (Constants.manifest as any).debuggerHost;
          const ipMatch = debuggerHost.match(/^(\d+\.\d+\.\d+\.\d+)/);
          if (ipMatch && ipMatch[1]) {
            ipAddress = ipMatch[1];
          }
        }
      }
    } catch (constantsError) {
      console.warn('Could not get IP from Expo Constants:', constantsError);
    }

    // Method 2: Try expo-network if Constants didn't work (less reliable on Android)
    if (!ipAddress) {
      try {
        // Dynamic import to avoid issues if expo-network is not available
        const Network = await import('expo-network');
        
        // Check if the method exists (for different versions of expo-network)
        if (typeof (Network as any).getIpAddressAsync === 'function') {
          ipAddress = await (Network as any).getIpAddressAsync();
        } else if (typeof (Network as any).getIpAddress === 'function') {
          ipAddress = await (Network as any).getIpAddress();
        } else if (Network.default && typeof Network.default.getIpAddressAsync === 'function') {
          ipAddress = await Network.default.getIpAddressAsync();
        }
      } catch (networkError) {
        // Silently fail - expo-network might not be available or might not work on Android
        console.warn('Could not get IP from expo-network:', networkError);
      }
    }

    // Cache and return the IP address
    if (ipAddress) {
      cachedIpAddress = ipAddress;
      return ipAddress;
    }

    // Fallback for Android emulator: use 10.0.2.2 which maps to host machine's localhost
    if (Platform.OS === 'android' && Device.isDevice === false) {
      console.log('Android emulator detected, using 10.0.2.2 as fallback');
      cachedIpAddress = '10.0.2.2';
      return '10.0.2.2';
    }

    // If we still don't have an IP, log a warning
    console.warn('Could not automatically detect IP address. Using localhost fallback.');
    return null;
  } catch (error) {
    console.error('Error getting IP address:', error);
    return null;
  }
}

/**
 * Replaces localhost in a URL with the device's IP address
 * @param url The URL that may contain localhost
 * @returns Promise<string> The URL with localhost replaced by IP address
 */
export async function replaceLocalhostWithIp(url: string): Promise<string> {
  if (!url.includes('localhost')) {
    return url;
  }

  const ipAddress = await getLocalIpAddress();
  if (ipAddress) {
    return url.replace(/localhost/g, ipAddress);
  }

  // If IP address is not available, return original URL
  console.warn('Could not get IP address, using original URL with localhost');
  return url;
}

/**
 * Gets the API base URL with localhost replaced by IP address if needed
 * @param defaultUrl The default URL (e.g., from environment variable)
 * @returns Promise<string> The API base URL
 */
export async function getApiBaseUrl(defaultUrl?: string): Promise<string> {
  const baseUrl = defaultUrl || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3006';
  
  // Only replace localhost if no explicit API URL is set
  if (!process.env.EXPO_PUBLIC_API_URL && baseUrl.includes('localhost')) {
    return await replaceLocalhostWithIp(baseUrl);
  }
  
  return baseUrl;
}

