import { z } from 'zod'

export const createPostSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().optional(),
  published: z.boolean().default(false),
  authorId: z.number().int().positive().optional(),
})

export const updatePostSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().nullable().optional(),
  published: z.boolean().optional(),
  authorId: z.number().int().positive().nullable().optional(),
})

export type CreatePostInput = z.infer<typeof createPostSchema>
export type UpdatePostInput = z.infer<typeof updatePostSchema>
