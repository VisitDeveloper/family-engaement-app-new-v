type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>;

/**
 * Lightweight analytics helper for auth flows.
 * Replace console.log with provider SDK (Amplitude/Mixpanel/etc.) when available.
 */
export function trackAuthEvent(event: string, payload?: AnalyticsPayload): void {
  try {
    console.log("[analytics][auth]", event, payload ?? {});
  } catch {
    // Never let analytics affect UX flows.
  }
}

