import { refreshConversationsInStore } from "@/lib/messaging-refresh";
import { useStore } from "@/store";
import { getProfileScopeKey } from "@/utils/chat-store";
import { useEffect, useRef } from "react";

/**
 * Background-refreshes conversations when the active profile changes.
 * Keeps cached list visible until the new API response arrives.
 */
export function useSyncChatOnProfileChange(): void {
  const currentProfile = useStore((s) => s.currentProfile);
  const scopeKey = getProfileScopeKey(currentProfile);
  const prevScopeRef = useRef<string | null>(null);

  useEffect(() => {
    if (!currentProfile) {
      prevScopeRef.current = null;
      return;
    }
    if (prevScopeRef.current === scopeKey) return;
    const isFirstRun = prevScopeRef.current === null;
    prevScopeRef.current = scopeKey;
    if (isFirstRun) return;
    void refreshConversationsInStore({ background: true });
  }, [scopeKey, currentProfile]);
}
