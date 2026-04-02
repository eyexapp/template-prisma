import type { PrismaClient, Post } from '@prisma/client'
import { BaseRepository } from './base.repository.js'
import { mapPrismaError } from '../errors.js'
import type { PaginationParams, PaginatedResult } from '../domain/types.js'

export class PostRepository extends BaseRepository<Post> {
  protected readonly modelName = 'post' as const

  constructor(client?: PrismaClient) {
    super(client)
  }

  async findPublished(params: PaginationParams = {}): Promise<PaginatedResult<Post>> {
    return this.findMany(params, { published: true }, { createdAt: 'desc' })
  }

  async findByAuthor(
    authorId: number,
    params: PaginationParams = {},
  ): Promise<PaginatedResult<Post>> {
    return this.findMany(params, { authorId }, { createdAt: 'desc' })
  }

  async publish(id: number): Promise<Post> {
    try {
      return await this.prisma.post.update({
        where: { id },
        data: { published: true },
      })
    } catch (error) {
      mapPrismaError(error)
    }
  }

  async unpublish(id: number): Promise<Post> {
    try {
      return await this.prisma.post.update({
        where: { id },
        data: { published: false },
      })
    } catch (error) {
      mapPrismaError(error)
    }
  }
}
