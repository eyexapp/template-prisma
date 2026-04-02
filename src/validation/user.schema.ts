import { z } from 'zod'

export const createUserSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().max(255).optional(),
})

export const updateUserSchema = z.object({
  email: z.string().email().max(255).optional(),
  name: z.string().max(255).nullable().optional(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
