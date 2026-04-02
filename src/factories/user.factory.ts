import type { PrismaClient, User } from '@prisma/client'

let counter = 0

/** Build a User plain object (no DB call) */
export function buildUser(overrides: Partial<Pick<User, 'email' | 'name'>> = {}): {
  email: string
  name: string
} {
  counter++
  return {
    email: overrides.email ?? `user${counter}@example.com`,
    name: overrides.name ?? `User ${counter}`,
  }
}

/** Create a User in the database */
export async function createUser(
  prisma: PrismaClient,
  overrides: Partial<Pick<User, 'email' | 'name'>> = {},
): Promise<User> {
  return prisma.user.create({ data: buildUser(overrides) })
}

/** Create multiple Users in the database */
export async function createUsers(
  prisma: PrismaClient,
  count: number,
  overrides: Partial<Pick<User, 'name'>> = {},
): Promise<User[]> {
  const users: User[] = []
  for (let i = 0; i < count; i++) {
    users.push(await createUser(prisma, overrides))
  }
  return users
}

/** Reset the internal counter (useful between test runs) */
export function resetUserCounter(): void {
  counter = 0
}
