import type { PrismaClient, User } from '@prisma/client'
import { BaseRepository } from './base.repository.js'
import { mapPrismaError } from '../errors.js'

export class UserRepository extends BaseRepository<User> {
  protected readonly modelName = 'user' as const

  constructor(client?: PrismaClient) {
    super(client)
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      return await this.prisma.user.findUnique({ where: { email } })
    } catch (error) {
      mapPrismaError(error)
    }
  }

  async findWithPosts(id: number): Promise<(User & { posts: unknown[] }) | null> {
    try {
      return await this.prisma.user.findUnique({
        where: { id },
        include: { posts: true },
      })
    } catch (error) {
      mapPrismaError(error)
    }
  }
}
