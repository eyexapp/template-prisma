import { PrismaClient } from '@prisma/client'
import { createUser } from '../src/factories/user.factory.js'
import { createPost } from '../src/factories/post.factory.js'

const prisma = new PrismaClient()

async function seed(): Promise<void> {
  console.log('🌱 Seeding database...')

  // Create demo users
  const alice = await createUser(prisma, { email: 'alice@example.com', name: 'Alice' })
  const bob = await createUser(prisma, { email: 'bob@example.com', name: 'Bob' })

  console.log(`  Created users: ${alice.name}, ${bob.name}`)

  // Create demo posts
  await createPost(prisma, {
    title: 'Getting Started with Prisma',
    content: 'Prisma is a modern database toolkit for TypeScript.',
    published: true,
    authorId: alice.id,
  })

  await createPost(prisma, {
    title: 'Advanced Prisma Patterns',
    content: 'Learn about repositories, factories, and testing.',
    published: true,
    authorId: alice.id,
  })

  await createPost(prisma, {
    title: 'Draft Post',
    content: 'This is a work in progress.',
    published: false,
    authorId: bob.id,
  })

  console.log('  Created 3 posts')
  console.log('✅ Seed complete')
}

seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
