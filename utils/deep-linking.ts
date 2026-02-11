import * as Linking from "expo-linking";
import { router } from "expo-router";

export interface DeepLinkRoute {
  pathname: string;
  params?: Record<string, string>;
}

/**
 * Parse a deep link URL and return the corresponding route
 * Supports the following deep link patterns:
 * - familyappengagement://chat/{chatID}
 * - familyappengagement://contact/{userId}?name=...&role=...&image=...
 * - familyappengagement://group/{chatID}
 * - familyappengagement://event/{id}
 * - familyappengagement://resource/{id}
 * - familyappengagement://feed/{id}
 * - familyappengagement://profile/{userId}
 */
export function parseDeepLink(url: string): DeepLinkRoute | null {
  try {
    const parsed = Linking.parse(url);
    const path = parsed.path?.replace(/^\//, "") || "";
    const queryParams = parsed.queryParams || {};

    // Chat: /chat/{chatID}
    const chatMatch = path.match(/^chat\/(.+)$/);
    if (chatMatch) {
      return {
        pathname: "/chat/[chatID]",
        params: { chatID: chatMatch[1] },
      };
    }

    // Contact Profile: /contact/{userId}?name=...&role=...&image=...
    const contactMatch = path.match(/^contact\/(.+)$/);
    if (contactMatch) {
      const params: Record<string, string> = { userId: contactMatch[1] };
      if (queryParams.name) params.name = String(queryParams.name);
      if (queryParams.role) params.role = String(queryParams.role);
      if (queryParams.image) params.image = String(queryParams.image);
      return {
        pathname: "/contact-profile/[userId]",
        params,
      };
    }

    // Group Profile: /group/{chatID}
    const groupMatch = path.match(/^group\/(.+)$/);
    if (groupMatch) {
      return {
        pathname: "/group-profile/[chatID]",
        params: { chatID: groupMatch[1] },
      };
    }

    // Event: /event/{id}
    const eventMatch = path.match(/^event\/(.+)$/);
    if (eventMatch) {
      return {
        pathname: "/event/[id]",
        params: { id: eventMatch[1] },
      };
    }

    // Resource: /resource/{id}
    const resourceMatch = path.match(/^resource\/(.+)$/);
    if (resourceMatch) {
      return {
        pathname: "/resource/[id]",
        params: { id: resourceMatch[1] },
      };
    }

    // Feed: /feed/{id}
    const feedMatch = path.match(/^feed\/(.+)$/);
    if (feedMatch) {
      return {
        pathname: "/feed/[id]",
        params: { id: feedMatch[1] },
      };
    }

    // User Profile: /profile/{userId}
    const profileMatch = path.match(/^profile\/(.+)$/);
    if (profileMatch) {
      return {
        pathname: "/user-profile",
        params: { userId: profileMatch[1] },
      };
    }

    return null;
  } catch (error) {
    console.error("Error parsing deep link:", error);
    return null;
  }
}

/**
 * Handle a deep link URL by navigating to the appropriate route
 * @param url - The deep link URL to handle
 * @param replace - Whether to replace the current route (default: true)
 */
export function handleDeepLink(url: string, replace: boolean = true): boolean {
  const route = parseDeepLink(url);
  if (!route) {
    console.warn("Unknown deep link pattern:", url);
    return false;
  }

  try {
    const navigationAction = replace ? router.replace : router.push;
    navigationAction({
      pathname: route.pathname as any,
      params: route.params,
    });
    return true;
  } catch (error) {
    console.error("Error navigating to deep link route:", error);
    return false;
  }
}
