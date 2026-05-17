import { useStore } from "@/store";
import type { UserRole } from "@/types";
import { getEffectiveRole } from "@/utils/roles";

/** Active JWT profile role when available; aligns UI with backend effectiveRole. */
export function useEffectiveRole(): UserRole | null {
  const currentProfile = useStore((s) => s.currentProfile);
  const storeRole = useStore((s) => s.role);
  const userRole = useStore((s) => s.user?.role);
  return getEffectiveRole({ currentProfile, storeRole, userRole });
}
