/**
 * Generic pagination types aligned with backend PaginatedResponseDto.
 * API returns: { items: T[], total, page, limit }
 */

/** Raw paginated response from API (backend returns `items`) */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

/** Paginated result with custom list key (e.g. posts, events, users) for app use */
export type PaginatedResult<T, K extends string> = {
  [P in K]: T[];
} & {
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
};

/** Build paginated result from API response and list key */
export function toPaginatedResult<T, K extends string>(
  response: PaginatedResponse<T>,
  listKey: K
): PaginatedResult<T, K> {
  const limit = response.limit || 1;
  return {
    [listKey]: response.items ?? [],
    total: response.total,
    page: response.page,
    limit: response.limit,
    totalPages: Math.ceil((response.total || 0) / limit),
  } as PaginatedResult<T, K>;
}
