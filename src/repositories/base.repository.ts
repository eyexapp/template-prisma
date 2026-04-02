import { PrismaClient } from '@prisma/client'
import { prisma as defaultClient } from '../client.js'
import { mapPrismaError } from '../errors.js'
import type { PaginationParams, PaginatedResult } from '../domain/types.js'

type ModelDelegate = {
  findUnique: (args: Record<string, unknown>) => Promise<unknown>
  findMany: (args?: Record<string, unknown>) => Promise<unknown[]>
  create: (args: Record<string, unknown>) => Promise<unknown>
  update: (args: Record<string, unknown>) => Promise<unknown>
  delete: (args: Record<string, unknown>) => Promise<unknown>
  count: (args?: Record<string, unknown>) => Promise<number>
}

/**
 * Generic base repository providing common CRUD operations.
 *
 * Extend this class for each Prisma model and override `modelName`
 * to get the corresponding Prisma delegate automatically.
 */
export abstract class BaseRepository<T> {
  protected readonly prisma: PrismaClient
  protected abstract readonly modelName: keyof PrismaClient

  constructor(client?: PrismaClient) {
    this.prisma = client ?? defaultClient
  }

  protected get delegate(): ModelDelegate {
    return this.prisma[this.modelName] as unknown as ModelDelegate
  }

  async findById(id: number): Promise<T | null> {
    try {
      const result = await this.delegate.findUnique({ where: { id } })
      return result as T | null
    } catch (error) {
      mapPrismaError(error)
    }
  }

  async findMany(
    params: PaginationParams = {},
    where: Record<string, unknown> = {},
    orderBy: Record<string, string> = { id: 'asc' },
  ): Promise<PaginatedResult<T>> {
    try {
      const { take = 20, cursor, skip } = params

      const args: Record<string, unknown> = {
        where,
        orderBy,
        take: take + 1, // Fetch one extra to determine hasMore
      }

      if (cursor) {
        args.cursor = { id: cursor }
        args.skip = 1   // Skip the cursor record itself
      } else if (skip) {
        args.skip = skip
      }

      const [results, count] = await Promise.all([
        this.delegate.findMany(args),
        this.delegate.count({ where }),
      ])

      const items = results as T[]
      const hasMore = items.length > take
      if (hasMore) items.pop()

      return { data: items, count, hasMore }
    } catch (error) {
      mapPrismaError(error)
    }
  }

  async create(data: Record<string, unknown>): Promise<T> {
    try {
      const result = await this.delegate.create({ data })
      return result as T
    } catch (error) {
      mapPrismaError(error)
    }
  }

  async update(id: number, data: Record<string, unknown>): Promise<T> {
    try {
      const result = await this.delegate.update({ where: { id }, data })
      return result as T
    } catch (error) {
      mapPrismaError(error)
    }
  }

  async delete(id: number): Promise<T> {
    try {
      const result = await this.delegate.delete({ where: { id } })
      return result as T
    } catch (error) {
      mapPrismaError(error)
    }
  }

  async count(where: Record<string, unknown> = {}): Promise<number> {
    try {
      return await this.delegate.count({ where })
    } catch (error) {
      mapPrismaError(error)
    }
  }
}
