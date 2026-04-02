/** Cursor-based pagination parameters */
export interface PaginationParams {
  take?: number
  cursor?: number
  skip?: number
}

/** Paginated result wrapper */
export interface PaginatedResult<T> {
  data: T[]
  count: number
  hasMore: boolean
}

/** Sort direction */
export type SortOrder = 'asc' | 'desc'
