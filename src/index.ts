// Client
export { prisma, disconnect } from './client.js'

// Repositories
export { BaseRepository } from './repositories/base.repository.js'
export { UserRepository } from './repositories/user.repository.js'
export { PostRepository } from './repositories/post.repository.js'

// Validation
export {
  createUserSchema,
  updateUserSchema,
  type CreateUserInput,
  type UpdateUserInput,
} from './validation/user.schema.js'
export {
  createPostSchema,
  updatePostSchema,
  type CreatePostInput,
  type UpdatePostInput,
} from './validation/post.schema.js'

// Errors
export {
  DatabaseError,
  NotFoundError,
  UniqueConstraintError,
  ForeignKeyError,
  mapPrismaError,
} from './errors.js'

// Domain types
export type { PaginationParams, PaginatedResult, SortOrder } from './domain/types.js'
