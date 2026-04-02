# Prisma Database Layer Template

A production-grade **database access layer** built with Prisma ORM, PostgreSQL, TypeScript, and Zod. This is not a full-stack app — it's a reusable data layer you integrate into any Node.js project.

## What's Included

- **Prisma ORM** with PostgreSQL — typed schema, migrations, seeding
- **Generic BaseRepository** — cursor-based pagination, error mapping
- **Zod Validation** — input schemas matching Prisma models
- **Factory Pattern** — reusable data builders for seeds and tests
- **Vitest** — integration tests against a real test database
- **DX Tooling** — ESLint flat config, Prettier, Husky, lint-staged

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start PostgreSQL (creates both dev and test databases)
docker compose up -d

# 3. Push schema to database
npm run db:push

# 4. Seed sample data
npm run db:seed

# 5. Explore with Prisma Studio
npm run db:studio
```

## Project Structure

```
prisma/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Seed script using factories
├── src/
│   ├── client.ts              # PrismaClient singleton + optional Accelerate
│   ├── errors.ts              # Typed DB errors + Prisma error mapper
│   ├── index.ts               # Barrel export (public API)
│   ├── domain/
│   │   └── types.ts           # Pagination, SortOrder types
│   ├── factories/
│   │   ├── user.factory.ts    # User data builders
│   │   └── post.factory.ts    # Post data builders
│   ├── repositories/
│   │   ├── base.repository.ts # Generic CRUD with pagination
│   │   ├── user.repository.ts # User-specific queries
│   │   └── post.repository.ts # Post-specific queries
│   └── validation/
│       ├── user.schema.ts     # Zod schemas for User input
│       └── post.schema.ts     # Zod schemas for Post input
├── tests/
│   ├── setup.ts               # Global test setup (push schema)
│   ├── helpers.ts             # Test client, cleanDatabase()
│   ├── repositories/
│   │   ├── user.repository.test.ts
│   │   └── post.repository.test.ts
│   └── validation/
│       └── schemas.test.ts
├── docker/
│   └── init-test-db.sql       # Creates test database
├── docker-compose.yml         # PostgreSQL 16
├── vitest.config.ts
├── eslint.config.js
├── tsconfig.json
└── package.json
```

## Scripts

| Command | Description |
|---|---|
| `npm run db:push` | Push schema to database (no migration) |
| `npm run db:migrate` | Create and apply a migration |
| `npm run db:seed` | Run seed script |
| `npm run db:studio` | Open Prisma Studio GUI |
| `npm run db:reset` | Reset database + re-seed |
| `npm run db:generate` | Regenerate Prisma Client |
| `npm test` | Run tests against test database |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Lint source files |
| `npm run typecheck` | TypeScript type check |
| `npm run format` | Format all files with Prettier |

## Architecture

### Repository Pattern

Every model has a repository extending `BaseRepository<T>`, which provides:

- `findById(id)` — Find by primary key
- `findMany(params, where, orderBy)` — Paginated query with cursor support
- `create(data)` / `update(id, data)` / `delete(id)` — CRUD operations
- `count(where)` — Record count

Model-specific repositories add domain methods:

```typescript
const users = new UserRepository()
const user = await users.findByEmail('alice@example.com')
const withPosts = await users.findWithPosts(user.id)

const posts = new PostRepository()
const published = await posts.findPublished({ take: 10 })
await posts.publish(postId)
```

### Error Handling

Prisma errors are automatically mapped to typed application errors:

| Prisma Code | Application Error | Description |
|---|---|---|
| P2002 | `UniqueConstraintError` | Duplicate value on unique field |
| P2003 | `ForeignKeyError` | Invalid foreign key reference |
| P2025 | `NotFoundError` | Record not found |

```typescript
import { UniqueConstraintError } from './src/index.js'

try {
  await users.create({ email: 'existing@example.com' })
} catch (error) {
  if (error instanceof UniqueConstraintError) {
    console.log('Duplicate:', error.fields) // ['email']
  }
}
```

### Validation with Zod

Validate input before passing to repositories:

```typescript
import { createUserSchema } from './src/index.js'

const result = createUserSchema.safeParse(rawInput)
if (!result.success) {
  console.error(result.error.flatten())
} else {
  await users.create(result.data)
}
```

### Factories

Factories build data objects for seeding and testing:

```typescript
import { buildUser, createUser } from './src/factories/user.factory.js'

// Plain object (no DB call)
const data = buildUser({ name: 'Custom Name' })

// Insert into database
const user = await createUser(prisma, { email: 'test@example.com' })
```

### Prisma Accelerate (Optional)

Set `ACCELERATE_ENABLED=true` in `.env` to enable [Prisma Accelerate](https://www.prisma.io/accelerate) caching. The client conditionally loads the extension — no code changes needed.

## Adding a New Model

1. **Define the model** in `prisma/schema.prisma`:
   ```prisma
   model Comment {
     id        Int      @id @default(autoincrement())
     body      String   @db.Text
     postId    Int      @map("post_id")
     post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
     createdAt DateTime @default(now()) @map("created_at")
     updatedAt DateTime @updatedAt @map("updated_at")

     @@index([postId])
     @@map("comments")
   }
   ```

2. **Create a repository** at `src/repositories/comment.repository.ts`:
   ```typescript
   import type { PrismaClient, Comment } from '@prisma/client'
   import { BaseRepository } from './base.repository.js'

   export class CommentRepository extends BaseRepository<Comment> {
     protected readonly modelName = 'comment' as const

     constructor(client?: PrismaClient) {
       super(client)
     }

     async findByPost(postId: number) {
       return this.findMany({}, { postId }, { createdAt: 'desc' })
     }
   }
   ```

3. **Add Zod schemas** at `src/validation/comment.schema.ts`

4. **Add a factory** at `src/factories/comment.factory.ts`

5. **Export** from `src/index.ts`

6. **Push schema**: `npm run db:push`

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | (required) |
| `ACCELERATE_ENABLED` | Enable Prisma Accelerate | `""` (disabled) |
| `PRISMA_LOG_LEVELS` | Comma-separated log levels | `"warn,error"` |

## Testing

Tests run against a separate `myapp_test` database (configured in `.env.test`). The global setup pushes the schema before tests run, and each test suite cleans the database between runs.

```bash
# Run all tests
npm test

# Run in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

## License

MIT

