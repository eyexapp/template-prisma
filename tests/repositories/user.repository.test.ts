import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import { UserRepository } from '../../src/repositories/user.repository.js'
import { createUser, createUsers } from '../../src/factories/user.factory.js'
import { createPost } from '../../src/factories/post.factory.js'
import { UniqueConstraintError, NotFoundError } from '../../src/errors.js'
import { testPrisma, cleanDatabase, resetFactories, disconnectTestClient } from '../helpers.js'

describe('UserRepository', () => {
  const repo = new UserRepository(testPrisma)

  beforeAll(async () => {
    await cleanDatabase()
  })

  beforeEach(async () => {
    await cleanDatabase()
    resetFactories()
  })

  afterAll(async () => {
    await cleanDatabase()
    await disconnectTestClient()
  })

  describe('create', () => {
    it('creates a user with email and name', async () => {
      const user = await repo.create({ email: 'alice@example.com', name: 'Alice' })

      expect(user).toMatchObject({
        email: 'alice@example.com',
        name: 'Alice',
      })
      expect(user.id).toBeTypeOf('number')
      expect(user.createdAt).toBeInstanceOf(Date)
      expect(user.updatedAt).toBeInstanceOf(Date)
    })

    it('creates a user without a name', async () => {
      const user = await repo.create({ email: 'noname@example.com' })

      expect(user.email).toBe('noname@example.com')
      expect(user.name).toBeNull()
    })

    it('throws UniqueConstraintError on duplicate email', async () => {
      await createUser(testPrisma, { email: 'dup@example.com' })

      await expect(repo.create({ email: 'dup@example.com' })).rejects.toThrow(
        UniqueConstraintError,
      )
    })
  })

  describe('findById', () => {
    it('returns the user when found', async () => {
      const created = await createUser(testPrisma)
      const found = await repo.findById(created.id)

      expect(found).toMatchObject({ id: created.id, email: created.email })
    })

    it('returns null when not found', async () => {
      const found = await repo.findById(999999)
      expect(found).toBeNull()
    })
  })

  describe('findByEmail', () => {
    it('returns the user for a matching email', async () => {
      const created = await createUser(testPrisma, { email: 'find@example.com' })
      const found = await repo.findByEmail('find@example.com')

      expect(found?.id).toBe(created.id)
    })

    it('returns null for a non-existent email', async () => {
      const found = await repo.findByEmail('ghost@example.com')
      expect(found).toBeNull()
    })
  })

  describe('findWithPosts', () => {
    it('includes related posts', async () => {
      const user = await createUser(testPrisma)
      await createPost(testPrisma, { authorId: user.id, title: 'Post A' })
      await createPost(testPrisma, { authorId: user.id, title: 'Post B' })

      const result = await repo.findWithPosts(user.id)

      expect(result).not.toBeNull()
      expect(result!.posts).toHaveLength(2)
    })

    it('returns null for a non-existent user', async () => {
      const result = await repo.findWithPosts(999999)
      expect(result).toBeNull()
    })
  })

  describe('update', () => {
    it('updates the user name', async () => {
      const created = await createUser(testPrisma, { name: 'Old' })
      const updated = await repo.update(created.id, { name: 'New' })

      expect(updated.name).toBe('New')
      expect(updated.id).toBe(created.id)
    })

    it('throws NotFoundError when updating a non-existent user', async () => {
      await expect(repo.update(999999, { name: 'Nope' })).rejects.toThrow(NotFoundError)
    })
  })

  describe('delete', () => {
    it('deletes and returns the user', async () => {
      const created = await createUser(testPrisma)
      const deleted = await repo.delete(created.id)

      expect(deleted.id).toBe(created.id)

      const found = await repo.findById(created.id)
      expect(found).toBeNull()
    })

    it('throws NotFoundError when deleting a non-existent user', async () => {
      await expect(repo.delete(999999)).rejects.toThrow(NotFoundError)
    })
  })

  describe('findMany', () => {
    it('returns paginated results', async () => {
      await createUsers(testPrisma, 5)

      const result = await repo.findMany({ take: 3 })

      expect(result.data).toHaveLength(3)
      expect(result.count).toBe(5)
      expect(result.hasMore).toBe(true)
    })

    it('returns all results when take exceeds total', async () => {
      await createUsers(testPrisma, 2)

      const result = await repo.findMany({ take: 10 })

      expect(result.data).toHaveLength(2)
      expect(result.count).toBe(2)
      expect(result.hasMore).toBe(false)
    })

    it('supports cursor-based pagination', async () => {
      const users = await createUsers(testPrisma, 5)

      const page1 = await repo.findMany({ take: 2 })
      expect(page1.data).toHaveLength(2)

      const lastId = page1.data[page1.data.length - 1].id
      const page2 = await repo.findMany({ take: 2, cursor: lastId })

      expect(page2.data).toHaveLength(2)
      expect(page2.data[0].id).toBeGreaterThan(lastId)
    })
  })

  describe('count', () => {
    it('returns the total record count', async () => {
      await createUsers(testPrisma, 3)
      const total = await repo.count()
      expect(total).toBe(3)
    })
  })
})
