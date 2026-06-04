import { messagingService } from "@/services/messaging.service";
import { useStore } from "@/store";

export type RefreshConversationsOptions = {
  /** When true, keeps the list visible and does not show pull-to-refresh / loading UI. */
  background?: boolean;
};

let conversationsRefreshInFlight = 0;

function clearConversationLoadingFlags(): void {
  const store = useStore.getState();
  store.setConversationsFetching(false);
  store.setLoading(false);
}

/**
 * Fetches conversations and merges into the store (stale-while-revalidate).
 * Background refreshes do not toggle UI loading indicators.
 */
export async function refreshConversationsInStore(
  opts?: RefreshConversationsOptions
): Promise<void> {
  const store = useStore.getState();
  const hasCached = (store.conversations?.length ?? 0) > 0;
  const background = opts?.background ?? hasCached;

  conversationsRefreshInFlight += 1;
  if (!background) {
    store.setLoading(true);
    store.setConversationsFetching(true);
  }

  try {
    const convs = await messagingService.getConversations();
    store.setConversations(convs.conversations);
  } catch (error) {
    throw error;
  } finally {
    conversationsRefreshInFlight = Math.max(0, conversationsRefreshInFlight - 1);
    if (conversationsRefreshInFlight === 0) {
      clearConversationLoadingFlags();
    }
  }
}

/** Clears stuck loading flags (e.g. after rehydrate or interrupted fetch). */
export function resetConversationsLoadingFlags(): void {
  conversationsRefreshInFlight = 0;
  clearConversationLoadingFlags();
}
