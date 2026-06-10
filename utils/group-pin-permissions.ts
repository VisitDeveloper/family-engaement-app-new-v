import type { ConversationResponseDto } from "@/types";
import type { UserRole } from "@/types";
import { isManagementRole } from "@/utils/roles";

export function canManageGroupPins(
  conversation: ConversationResponseDto | undefined,
  currentUserId: string | null,
  effectiveRole: UserRole | null
): boolean {
  if (!conversation || conversation.type !== "group" || !currentUserId) {
    return false;
  }
  if (effectiveRole === "parent") return false;
  if (isManagementRole(effectiveRole)) return true;
  if (conversation.createdById === currentUserId) return true;

  const participant = conversation.participants?.find(
    (p) => p.user?.id === currentUserId
  );
  return participant?.isAdmin === true;
}
