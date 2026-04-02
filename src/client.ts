import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'

function createPrismaClient(): PrismaClient {
  const logLevels = process.env.PRISMA_LOG_LEVELS?.split(',').filter(Boolean) ?? []

  const client = new PrismaClient({
    log: logLevels as Array<'query' | 'info' | 'warn' | 'error'>,
  })

  if (process.env.ACCELERATE_ENABLED === 'true') {
    return client.$extends(withAccelerate()) as unknown as PrismaClient
  }

  return client
}

// Singleton pattern — prevent multiple instances during hot-reload
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export async function disconnect(): Promise<void> {
  await prisma.$disconnect()
}
