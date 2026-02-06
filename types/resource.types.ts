export type ResourceType = 'book' | 'activity' | 'video';

export interface ResourceResponseDto {
  id: string;
  title: string;
  description: string;
  type: ResourceType;
  category: string;
  ageRange: string | null;
  imageUrl: string | null;
  contentUrl: string | null;
  averageRating: number;
  ratingsCount: number;
  createdBy: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  isSaved?: boolean;
  userRating?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface GetResourcesParams {
  page?: number;
  limit?: number;
  filter?: 'all' | 'books' | 'activities' | 'videos' | 'saved';
  category?: string;
  search?: string;
}

export interface RateResourceDto {
  rating: number;
}
