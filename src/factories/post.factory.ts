import type { PrismaClient, Post } from '@prisma/client'

let counter = 0

/** Build a Post plain object (no DB call) */
export function buildPost(
  overrides: Partial<Pick<Post, 'title' | 'content' | 'published' | 'authorId'>> = {},
): {
  title: string
  content: string
  published: boolean
  authorId?: number | null
} {
  counter++
  return {
    title: overrides.title ?? `Post Title ${counter}`,
    content: overrides.content ?? `Content for post ${counter}`,
    published: overrides.published ?? false,
    ...(overrides.authorId !== undefined ? { authorId: overrides.authorId } : {}),
  }
}

/** Create a Post in the database */
export async function createPost(
  prisma: PrismaClient,
  overrides: Partial<Pick<Post, 'title' | 'content' | 'published' | 'authorId'>> = {},
): Promise<Post> {
  return prisma.post.create({ data: buildPost(overrides) })
}

/** Create multiple Posts in the database */
export async function createPosts(
  prisma: PrismaClient,
  count: number,
  overrides: Partial<Pick<Post, 'published' | 'authorId'>> = {},
): Promise<Post[]> {
  const posts: Post[] = []
  for (let i = 0; i < count; i++) {
    posts.push(await createPost(prisma, overrides))
  }
  return posts
}

/** Reset the internal counter (useful between test runs) */
export function resetPostCounter(): void {
  counter = 0
}
