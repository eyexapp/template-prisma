import { describe, it, expect } from 'vitest'
import {
  createUserSchema,
  updateUserSchema,
} from '../../src/validation/user.schema.js'
import {
  createPostSchema,
  updatePostSchema,
} from '../../src/validation/post.schema.js'

describe('User Schemas', () => {
  describe('createUserSchema', () => {
    it('accepts valid input with email and name', () => {
      const result = createUserSchema.safeParse({
        email: 'alice@example.com',
        name: 'Alice',
      })
      expect(result.success).toBe(true)
    })

    it('accepts input without optional name', () => {
      const result = createUserSchema.safeParse({ email: 'alice@example.com' })
      expect(result.success).toBe(true)
    })

    it('rejects missing email', () => {
      const result = createUserSchema.safeParse({ name: 'Alice' })
      expect(result.success).toBe(false)
    })

    it('rejects invalid email format', () => {
      const result = createUserSchema.safeParse({ email: 'not-an-email' })
      expect(result.success).toBe(false)
    })

    it('rejects email exceeding max length', () => {
      const longEmail = 'a'.repeat(250) + '@x.com'
      const result = createUserSchema.safeParse({ email: longEmail })
      expect(result.success).toBe(false)
    })

    it('rejects name exceeding max length', () => {
      const result = createUserSchema.safeParse({
        email: 'ok@example.com',
        name: 'A'.repeat(256),
      })
      expect(result.success).toBe(false)
    })
  })

  describe('updateUserSchema', () => {
    it('accepts partial update with email only', () => {
      const result = updateUserSchema.safeParse({ email: 'new@example.com' })
      expect(result.success).toBe(true)
    })

    it('accepts partial update with name only', () => {
      const result = updateUserSchema.safeParse({ name: 'New Name' })
      expect(result.success).toBe(true)
    })

    it('accepts null name (to clear it)', () => {
      const result = updateUserSchema.safeParse({ name: null })
      expect(result.success).toBe(true)
    })

    it('accepts empty object', () => {
      const result = updateUserSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('rejects invalid email', () => {
      const result = updateUserSchema.safeParse({ email: 'bad' })
      expect(result.success).toBe(false)
    })
  })
})

describe('Post Schemas', () => {
  describe('createPostSchema', () => {
    it('accepts valid input with all fields', () => {
      const result = createPostSchema.safeParse({
        title: 'My Post',
        content: 'Some content',
        published: true,
        authorId: 1,
      })
      expect(result.success).toBe(true)
    })

    it('accepts minimal input with title only', () => {
      const result = createPostSchema.safeParse({ title: 'Title Only' })
      expect(result.success).toBe(true)
    })

    it('defaults published to false', () => {
      const result = createPostSchema.safeParse({ title: 'Draft' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.published).toBe(false)
      }
    })

    it('rejects missing title', () => {
      const result = createPostSchema.safeParse({ content: 'No title' })
      expect(result.success).toBe(false)
    })

    it('rejects empty title', () => {
      const result = createPostSchema.safeParse({ title: '' })
      expect(result.success).toBe(false)
    })

    it('rejects title exceeding max length', () => {
      const result = createPostSchema.safeParse({ title: 'T'.repeat(256) })
      expect(result.success).toBe(false)
    })

    it('rejects negative authorId', () => {
      const result = createPostSchema.safeParse({ title: 'OK', authorId: -1 })
      expect(result.success).toBe(false)
    })

    it('rejects non-integer authorId', () => {
      const result = createPostSchema.safeParse({ title: 'OK', authorId: 1.5 })
      expect(result.success).toBe(false)
    })
  })

  describe('updatePostSchema', () => {
    it('accepts partial update', () => {
      const result = updatePostSchema.safeParse({ title: 'New Title' })
      expect(result.success).toBe(true)
    })

    it('accepts null content (to clear it)', () => {
      const result = updatePostSchema.safeParse({ content: null })
      expect(result.success).toBe(true)
    })

    it('accepts null authorId (to unlink author)', () => {
      const result = updatePostSchema.safeParse({ authorId: null })
      expect(result.success).toBe(true)
    })

    it('accepts empty object', () => {
      const result = updatePostSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('rejects empty title string', () => {
      const result = updatePostSchema.safeParse({ title: '' })
      expect(result.success).toBe(false)
    })
  })
})
