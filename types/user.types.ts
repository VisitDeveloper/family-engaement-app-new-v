/** User role (matches backend UserRole) */
export type UserRole = 'admin' | 'teacher' | 'parent' | 'student';

/** User as returned in auth/login, register, profile */
export interface UserResponseDto {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  phoneNumber?: string;
  profilePicture?: string;
  childName?: string;
  subjects?: string[];
  lastOnline?: string | Date;
}

/** User settings as returned in profile (GET/PUT /auth/profile) */
export interface UserSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  textMessages: boolean;
  urgentAlerts: boolean;
  appLanguage: string;
}

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
}

/** Alias for parent list (same shape as UserListItemDto) */
export type ParentDto = UserListItemDto;

/** Profile as returned by GET /auth/profile */
export interface ProfileResponseDto {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  phoneNumber?: string;
  profilePicture?: string;
  subjects?: string[];
  childName?: string;
  lastOnline?: string | Date;
  createdAt: string;
  updatedAt: string;
  settings?: UserSettings;
  classrooms?: import('./messaging.types').ClassroomResponseDto[];
}

/** Body for PUT /auth/profile (partial update; only send changed fields) */
export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
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
