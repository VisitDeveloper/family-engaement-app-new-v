import Constants from 'expo-constants';
import * as Network from 'expo-network';

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
      if (expoConfig?.hostUri) {
        // hostUri format: "192.168.1.100:8081"
        const hostUri = expoConfig.hostUri;
        const ipMatch = hostUri.match(/^(\d+\.\d+\.\d+\.\d+)/);
        if (ipMatch && ipMatch[1]) {
          ipAddress = ipMatch[1];
        }
      }
      
      // Also check debuggerHostName which might contain the IP
      if (!ipAddress && (expoConfig as any)?.debuggerHost) {
        const debuggerHost = (expoConfig as any).debuggerHost;
        const ipMatch = debuggerHost.match(/^(\d+\.\d+\.\d+\.\d+)/);
        if (ipMatch && ipMatch[1]) {
          ipAddress = ipMatch[1];
        }
      }
    } catch (constantsError) {
      console.warn('Could not get IP from Expo Constants:', constantsError);
    }

    // Method 2: Try expo-network if Constants didn't work
    if (!ipAddress) {
      try {
        // Check if the method exists (for different versions of expo-network)
        if (typeof (Network as any).getIpAddressAsync === 'function') {
          ipAddress = await (Network as any).getIpAddressAsync();
        } else if (typeof (Network as any).getIpAddress === 'function') {
          ipAddress = await (Network as any).getIpAddress();
        }
      } catch (networkError) {
        console.warn('Could not get IP from expo-network:', networkError);
      }
    }

    // Cache and return the IP address
    if (ipAddress) {
      cachedIpAddress = ipAddress;
      return ipAddress;
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

