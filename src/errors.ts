import { Prisma } from '@prisma/client'

export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly cause?: unknown,
  ) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export class NotFoundError extends DatabaseError {
  constructor(entity: string, id?: string | number) {
    super(id ? `${entity} with id ${id} not found` : `${entity} not found`, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class UniqueConstraintError extends DatabaseError {
  constructor(
    public readonly fields: string[],
  ) {
    super(`Unique constraint violated on: ${fields.join(', ')}`, 'UNIQUE_CONSTRAINT')
    this.name = 'UniqueConstraintError'
  }
}

export class ForeignKeyError extends DatabaseError {
  constructor(message: string) {
    super(message, 'FOREIGN_KEY')
    this.name = 'ForeignKeyError'
  }
}

/**
 * Maps Prisma-specific errors to typed application errors.
 *
 * Common Prisma error codes:
 * - P2002: Unique constraint violation
 * - P2003: Foreign key constraint violation
 * - P2025: Record not found
 */
export function mapPrismaError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': {
        const fields = (error.meta?.target as string[]) ?? ['unknown']
        throw new UniqueConstraintError(fields)
      }
      case 'P2003':
        throw new ForeignKeyError(
          `Foreign key constraint failed on: ${error.meta?.field_name ?? 'unknown'}`,
        )
      case 'P2025':
        throw new NotFoundError(String(error.meta?.modelName ?? 'Record'))
      default:
        throw new DatabaseError(error.message, error.code, error)
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    throw new DatabaseError('Validation error: ' + error.message, 'VALIDATION', error)
  }

  throw error
}
