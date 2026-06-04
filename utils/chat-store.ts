import { resetConversationsLoadingFlags } from "@/lib/messaging-refresh";
import type { CurrentProfile } from "@/types";
import { useStore } from "@/store";

/** Stable key for the active profile context (used to trigger background refreshes). */
export function getProfileScopeKey(
  profile: CurrentProfile | null | undefined
): string {
  if (!profile) return "default";
  return (
    profile.id ??
    `${profile.role}|${profile.organizationId ?? ""}|${profile.siteId ?? ""}`
  );
}

/** Clears messaging cache (logout only — not used on profile switch). */
export function clearChatState(): void {
  const store = useStore.getState();
  store.setConversations([]);
  resetConversationsLoadingFlags();
  const messages = store.messages as Record<string, unknown>;
  for (const conversationId of Object.keys(messages)) {
    store.setMessages(conversationId, []);
  }
}
