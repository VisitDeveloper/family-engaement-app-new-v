import type { CurrentProfile, UserRole } from "@/types";

/** Roles with org/site-scoped admin capabilities (same UI affordances as super admin). */
export const MANAGEMENT_ROLES = [
  "admin",
  "organization_manager",
  "site_manager",
] as const satisfies readonly UserRole[];

export type ManagementRole = (typeof MANAGEMENT_ROLES)[number];

export const MANAGEMENT_AND_TEACHER_ROLES = [
  ...MANAGEMENT_ROLES,
  "teacher",
] as const satisfies readonly UserRole[];

export const MANAGEMENT_TEACHER_PARENT_ROLES = [
  ...MANAGEMENT_ROLES,
  "teacher",
  "parent",
] as const satisfies readonly UserRole[];

export function isManagementRole(
  role: string | null | undefined
): role is ManagementRole {
  return role != null && (MANAGEMENT_ROLES as readonly string[]).includes(role);
}

/** Portal Send messages toggle applies only to org/site manager profiles. */
export function isManagerMessagingRole(role: string | null | undefined): boolean {
  return role === "organization_manager" || role === "site_manager";
}

/** Resolved from API; falls back so teachers/parents are not blocked when permissions are missing. */
export function resolveCanSendMessages(
  apiValue: boolean | undefined,
  effectiveRole: string | null | undefined
): boolean {
  if (typeof apiValue === "boolean") return apiValue;
  return !isManagerMessagingRole(effectiveRole);
}

export function isManagementOrTeacher(role: string | null | undefined): boolean {
  return (
    role != null &&
    (MANAGEMENT_AND_TEACHER_ROLES as readonly string[]).includes(role)
  );
}

/** Hide super/org/site managers from recipient pickers (same as legacy admin filter). */
export function shouldHideFromContactList(
  role: string | null | undefined
): boolean {
  return isManagementRole(role);
}

/** JWT active profile when set; otherwise store role; otherwise persisted user.role. */
export function getEffectiveRole(params: {
  currentProfile?: CurrentProfile | null;
  storeRole?: UserRole | null;
  userRole?: UserRole | null;
}): UserRole | null {
  const { currentProfile, storeRole, userRole } = params;
  return currentProfile?.role ?? storeRole ?? userRole ?? null;
}
