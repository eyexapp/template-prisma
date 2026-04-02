import { PrismaClient } from '@prisma/client'
import { resetUserCounter } from '../src/factories/user.factory.js'
import { resetPostCounter } from '../src/factories/post.factory.js'

/** Dedicated PrismaClient for tests — bypasses the singleton in src/client.ts */
export const testPrisma = new PrismaClient()

/** Delete all records respecting foreign key order */
export async function cleanDatabase(): Promise<void> {
  await testPrisma.post.deleteMany()
  await testPrisma.user.deleteMany()
}

/** Reset factory counters so each test starts with predictable data */
export function resetFactories(): void {
  resetUserCounter()
  resetPostCounter()
}

/** Disconnect the test client — call in afterAll */
export async function disconnectTestClient(): Promise<void> {
  await testPrisma.$disconnect()
}
