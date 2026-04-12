/** User role (matches backend UserRole) */
export type UserRole =
  | 'admin'
  | 'teacher'
  | 'parent'
  | 'student'
  | 'organization_manager'
  | 'site_manager';

/** User as returned in auth/login, register, profile, switch-profile */
export interface UserResponseDto {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  organizationId?: string | null;
  siteId?: string | null;
  phoneNumber?: string;
  profilePicture?: string;
  childName?: string;
  subjects?: string[];
  lastOnline?: string | Date;
}

/** User settings as returned in profile (GET /auth/profile) */
export interface UserSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  textMessages: boolean;
  urgentAlerts: boolean;
  appLanguage: string;
}

/** Body for PATCH /auth/settings (only fields to update) */
export type UpdateSettingsRequest = Partial<UserSettings>;

/** User list item (users/parents endpoints) */
export interface UserListItemDto {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  profilePicture?: string | null;
  phoneNumber?: string | null;
  role?: UserRole;
  childName?: string | null;
  lastOnline?: string | Date | null;
  /** From GET /users — distinct push client platforms when present */
  platforms?: string[];
}

/** Alias for parent list (same shape as UserListItemDto) */
export type ParentDto = UserListItemDto;

/** Active profile from GET /auth/profile (use currentProfile.id to match with ProfileItem.id) */
export interface CurrentProfile {
  id: string;
  role: UserRole;
  organizationId: string | null;
  siteId: string | null;
}

/** Org-level map keys from backend (portal-editable). */
export interface MobileMapsConfigDto {
  googleMapsAndroidApiKey?: string | null;
  googleMapsIosApiKey?: string | null;
}

/** Resolved media limits from GET /auth/profile */
export interface MediaUploadLimitsDto {
  maxVideoDurationSeconds: number;
  maxUploadSizeMb: number;
}

/** Profile as returned by GET /auth/profile */
export interface ProfileResponseDto {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  organizationId?: string | null;
  siteId?: string | null;
  phoneNumber?: string;
  profilePicture?: string;
  subjects?: string[];
  childName?: string;
  lastOnline?: string | Date;
  createdAt: string;
  updatedAt: string;
  settings?: UserSettings;
  classrooms?: import('./messaging.types').ClassroomResponseDto[];
  /** Active profile from JWT; use currentProfile.id to match with GET /auth/profiles items. */
  currentProfile?: CurrentProfile;
  mobileMapsConfig?: MobileMapsConfigDto;
  mediaUploadLimits?: MediaUploadLimitsDto;
}

/** Body for PUT /auth/profile (partial update; only send changed fields) */
export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  subjects?: string[];
  settings?: Partial<UserSettings>;
}

/** Auth login/register response */
export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: UserResponseDto;
  message: string;
  data?: {
    user?: UserResponseDto;
    access_token?: string;
    refresh_token?: string;
  };
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  message: string;
}

export interface AuthSessionItem {
  id: string;
  createdAt: string;
  lastActiveAt: string;
  userAgent: string | null;
  clientLabel: string | null;
  isCurrent: boolean;
}

export interface AuthSessionsResponse {
  sessions: AuthSessionItem[];
}

export interface RevokeSessionResponse {
  message: string;
  wasCurrent: boolean;
}

export interface RevokeOthersResponse {
  message: string;
  revokedCount: number;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  message?: string;
  success?: boolean;
  access_token?: string;
  data?: { access_token?: string };
}

export interface UpdateProfilePictureResponse {
  message?: string;
  profilePicture?: string;
  user?: ProfileResponseDto;
}

// --- Switch Profile (GET /auth/profiles, POST /auth/switch-profile) ---

/** One profile the user can switch to. id format: role|organizationId|siteId (empty string when null). Match with currentProfile.id. */
export interface ProfileItem {
  /** Stable ID from API; use to match with currentProfile.id. Optional for backward compat. */
  id?: string;
  role: UserRole;
  siteId?: string | null;
  organizationId?: string | null;
  siteName?: string | null;
  organizationName?: string | null;
}

export interface ProfilesResponse {
  profiles: ProfileItem[];
}

/** Request body for POST /auth/switch-profile */
export interface SwitchProfileBody {
  role: UserRole;
  siteId?: string | null;
  organizationId?: string | null;
}

/** Response from POST /auth/switch-profile */
export interface SwitchProfileResponse {
  access_token: string;
  refresh_token: string;
  user: UserResponseDto;
  message: string;
}

export interface RequestPhoneChangeOtpRequest {
  phoneNumber: string;
}

export interface VerifyPhoneChangeOtpRequest {
  code: string;
}

export interface VerifyPhoneChangeOtpResponse {
  message: string;
  phoneNumber: string;
}
