/** Shared author shape (post/comment/event) */
export interface AuthorResponseDto {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  profilePicture?: string | null;
}
