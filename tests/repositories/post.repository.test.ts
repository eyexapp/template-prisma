import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import { PostRepository } from '../../src/repositories/post.repository.js'
import { createUser } from '../../src/factories/user.factory.js'
import { createPost, createPosts } from '../../src/factories/post.factory.js'
import { NotFoundError } from '../../src/errors.js'
import { testPrisma, cleanDatabase, resetFactories, disconnectTestClient } from '../helpers.js'

describe('PostRepository', () => {
  const repo = new PostRepository(testPrisma)

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
    it('creates a post with title and content', async () => {
      const post = await repo.create({ title: 'Hello', content: 'World' })

      expect(post).toMatchObject({
        title: 'Hello',
        content: 'World',
        published: false,
      })
      expect(post.id).toBeTypeOf('number')
      expect(post.createdAt).toBeInstanceOf(Date)
    })

    it('creates a post linked to an author', async () => {
      const user = await createUser(testPrisma)
      const post = await repo.create({ title: 'Authored', authorId: user.id })

      expect(post.authorId).toBe(user.id)
    })
  })

  describe('findById', () => {
    it('returns the post when found', async () => {
      const created = await createPost(testPrisma)
      const found = await repo.findById(created.id)

      expect(found).toMatchObject({ id: created.id, title: created.title })
    })

    it('returns null when not found', async () => {
      const found = await repo.findById(999999)
      expect(found).toBeNull()
    })
  })

  describe('findPublished', () => {
    it('returns only published posts', async () => {
      const user = await createUser(testPrisma)
      await createPosts(testPrisma, 3, { published: true, authorId: user.id })
      await createPosts(testPrisma, 2, { published: false, authorId: user.id })

      const result = await repo.findPublished()

      expect(result.data).toHaveLength(3)
      expect(result.count).toBe(3)
      result.data.forEach((post) => {
        expect(post.published).toBe(true)
      })
    })
  })

  describe('findByAuthor', () => {
    it('returns posts for a specific author', async () => {
      const alice = await createUser(testPrisma, { name: 'Alice' })
      const bob = await createUser(testPrisma, { name: 'Bob' })
      await createPosts(testPrisma, 3, { authorId: alice.id })
      await createPosts(testPrisma, 2, { authorId: bob.id })

      const result = await repo.findByAuthor(alice.id)

      expect(result.data).toHaveLength(3)
      expect(result.count).toBe(3)
      result.data.forEach((post) => {
        expect(post.authorId).toBe(alice.id)
      })
    })

    it('returns empty when author has no posts', async () => {
      const user = await createUser(testPrisma)
      const result = await repo.findByAuthor(user.id)

      expect(result.data).toHaveLength(0)
      expect(result.count).toBe(0)
      expect(result.hasMore).toBe(false)
    })
  })

  describe('publish / unpublish', () => {
    it('publishes a draft post', async () => {
      const post = await createPost(testPrisma, { published: false })
      expect(post.published).toBe(false)

      const published = await repo.publish(post.id)
      expect(published.published).toBe(true)
    })

    it('unpublishes a published post', async () => {
      const post = await createPost(testPrisma, { published: true })
      expect(post.published).toBe(true)

      const unpublished = await repo.unpublish(post.id)
      expect(unpublished.published).toBe(false)
    })

    it('throws NotFoundError when publishing a non-existent post', async () => {
      await expect(repo.publish(999999)).rejects.toThrow(NotFoundError)
    })
  })

  describe('update', () => {
    it('updates post title', async () => {
      const created = await createPost(testPrisma)
      const updated = await repo.update(created.id, { title: 'Updated Title' })

      expect(updated.title).toBe('Updated Title')
      expect(updated.id).toBe(created.id)
    })

    it('throws NotFoundError when updating a non-existent post', async () => {
      await expect(repo.update(999999, { title: 'Nope' })).rejects.toThrow(NotFoundError)
    })
  })

  describe('delete', () => {
    it('deletes and returns the post', async () => {
      const created = await createPost(testPrisma)
      const deleted = await repo.delete(created.id)

      expect(deleted.id).toBe(created.id)

      const found = await repo.findById(created.id)
      expect(found).toBeNull()
    })

    it('throws NotFoundError when deleting a non-existent post', async () => {
      await expect(repo.delete(999999)).rejects.toThrow(NotFoundError)
    })
  })

  describe('findMany (pagination)', () => {
    it('returns paginated results with hasMore', async () => {
      await createPosts(testPrisma, 5)

      const result = await repo.findMany({ take: 3 })

      expect(result.data).toHaveLength(3)
      expect(result.count).toBe(5)
      expect(result.hasMore).toBe(true)
    })

    it('returns all when take exceeds total', async () => {
      await createPosts(testPrisma, 2)

      const result = await repo.findMany({ take: 10 })

      expect(result.data).toHaveLength(2)
      expect(result.hasMore).toBe(false)
    })
  })

  describe('count', () => {
    it('counts all posts', async () => {
      await createPosts(testPrisma, 4)
      const total = await repo.count()
      expect(total).toBe(4)
    })
  })
})
