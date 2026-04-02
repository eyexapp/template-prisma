# AGENTS.md — Prisma Database Access Layer (PostgreSQL)

## Project Identity

| Key | Value |
|-----|-------|
| Runtime | Node.js 20+ (ESM) |
| Language | TypeScript (strict mode) |
| Category | Pure Database Access Layer |
| ORM | Prisma 6 |
| Database | PostgreSQL |
| Validation | Zod |
| Testing | Vitest |
| Linting | ESLint 9 (flat config) + Prettier |

> **This is NOT a web application.** No HTTP server, no API routes. This is a pure database access layer consumed as a library.

---

## Architecture — Repository + Prisma ORM

```
src/
├── core/               ← CONFIG: Zod-validated env, logger, errors, types
│   ├── config.ts       ← Env config validated by Zod
│   ├── errors.ts       ← Typed error classes (UniqueConstraintError, etc.)
│   ├── logger.ts       ← Structured logger
│   └── types.ts        ← Shared types (PaginatedResult, CursorParams, etc.)
├── client/
│   └── index.ts        ← globalThis singleton PrismaClient
├── repositories/
│   ├── base.repository.ts  ← Generic CRUD + cursor pagination
│   ├── user.repository.ts  ← Domain-specific queries
│   └── index.ts            ← Barrel export
├── schemas/            ← Zod validation schemas (SEPARATE from repos)
│   ├── user.schema.ts
│   └── index.ts
├── factories/          ← Dual-purpose: seed + test data generation
│   ├── user.factory.ts
│   └── index.ts
├── seed.ts             ← Database seeding entry
└── index.ts            ← Main barrel export (public API)
prisma/
├── schema.prisma       ← Single source of truth for DB schema
└── migrations/         ← Prisma auto-generated migrations
```

### Strict Layer Rules

| Layer | Can Import From | NEVER Imports |
|-------|----------------|---------------|
| `repositories/` | client/, core/ | schemas/, factories/ |
| `schemas/` | core/ | repositories/, client/ |
| `factories/` | schemas/, core/ | repositories/ |
| `client/` | core/ | repositories/, schemas/ |
| `core/` | (none — foundational) | Everything else |

---

## Adding New Code — Where Things Go

### New Entity Checklist
1. **Prisma model**: Add to `prisma/schema.prisma` with `@@map("snake_case")` table name
2. **Migration**: `npx prisma migrate dev --name add_entity`
3. **Repository**: `src/repositories/entity.repository.ts` extends `BaseRepository<Entity, Prisma.EntityDelegate>`
4. **Zod schema**: `src/schemas/entity.schema.ts`
5. **Factory**: `src/factories/entity.factory.ts`
6. **Export**: Add to barrel files (`index.ts`)
7. **Tests**: `__tests__/entity.repository.test.ts`

### Prisma Model Pattern
```prisma
model Product {
  id          String   @id @default(uuid())
  name        String
  price       Decimal
  categoryId  String   @map("category_id")
  category    Category @relation(fields: [categoryId], references: [id])
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@map("products")
}
// PascalCase model name, snake_case columns via @map, snake_case table via @@map
```

### Repository Pattern
```typescript
import { Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository.js';
import type { Product } from '@prisma/client';

export class ProductRepository extends BaseRepository<Product, Prisma.ProductDelegate> {
  constructor(client: PrismaClient) {
    super(client.product);
  }

  async findByCategory(categoryId: string) {
    return this.delegate.findMany({ where: { categoryId } });
  }
}
// Inherits: findAll, findById, findFirst, create, update, delete, count, findPaginated (cursor-based)
```

### Factory Pattern (Dual Purpose)
```typescript
import { faker } from '@faker-js/faker';
import { createProductSchema } from '@/schemas/product.schema.js';

export function buildProduct(overrides: Partial<CreateProductInput> = {}) {
  return createProductSchema.parse({
    name: faker.commerce.productName(),
    price: faker.commerce.price(),
    ...overrides,
  });
}
// Used in seed.ts AND in tests
```

---

## Design & Architecture Principles

### globalThis Singleton Client
```typescript
// ✅ src/client/index.ts — singleton pattern
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// ❌ NEVER create PrismaClient in multiple places
```

### Cursor-Based Pagination (NOT Offset)
```typescript
// ✅ Cursor pagination — consistent, performant at scale
const result = await repo.findPaginated({
  cursor: lastSeenId,
  take: 20,
});

// ❌ NEVER use skip/take offset pagination — inconsistent with mutations
```

### Zod Schemas — Separate from Repositories
```typescript
// ✅ schemas/product.schema.ts — validation separate from data access
export const createProductSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
});

// ❌ NEVER put Zod schemas inside repositories
```

---

## Error Handling

### Prisma Error Mapping
```typescript
// mapPrismaError() in core/errors.ts
// P2002 → UniqueConstraintError (field-level detail)
// P2003 → ForeignKeyError (relation detail)
// P2025 → NotFoundError
// Anything else → re-throw as DatabaseError

try {
  return await this.delegate.create({ data });
} catch (error) {
  throw mapPrismaError(error);
}
```

### Typed Error Hierarchy
- `DatabaseError` (base)
- `UniqueConstraintError` — P2002, includes target fields
- `ForeignKeyError` — P2003, includes relation name
- `NotFoundError` — P2025, record not found

---

## Code Quality

### Naming Conventions
| Artifact | Convention | Example |
|----------|-----------|---------|
| Prisma model | PascalCase | `OrderItem` |
| Table name (@@map) | snake_case | `order_items` |
| Column name (@map) | snake_case | `created_at` |
| Repository | `name.repository.ts` | `product.repository.ts` |
| Schema | `name.schema.ts` | `product.schema.ts` |
| Factory | `name.factory.ts` | `product.factory.ts` |

### ESM + Path Alias
```typescript
// ✅ .js extensions mandatory (ESM)
import { prisma } from '@/client/index.js';

// ✅ @/ alias points to src/
import { NotFoundError } from '@/core/errors.js';

// ❌ NEVER omit .js extension
```

### Every Model Needs Timestamps
```prisma
// ✅ ALWAYS include:
createdAt DateTime @default(now()) @map("created_at")
updatedAt DateTime @updatedAt @map("updated_at")
```

---

## Testing Strategy

| Level | What | Where | Tool |
|-------|------|-------|------|
| Unit | Error mapping, Zod schemas | `__tests__/` | Vitest |
| Integration | Repositories against real DB | `__tests__/` | Vitest + Prisma test env |

### Test Isolation
```typescript
// Use factories for consistent test data
const product = buildProduct({ name: 'Test Widget' });
const created = await productRepo.create(product);

// Clean up per-test or use transactions
```

---

## Security & Performance

### Security
- Zod validation before any write operation
- Prisma parameterized queries — no SQL injection
- Environment config validated at startup
- Never expose raw Prisma errors — always `mapPrismaError()`

### Performance
- Cursor pagination — O(1) regardless of page
- `select` to pick only needed fields: `delegate.findMany({ select: { id: true, name: true } })`
- `include` for relations only when needed — no eager loading by default
- Batch writes with `createMany()` / `$transaction()`
- Run `prisma migrate deploy` in CI — never `migrate dev`

---

## Commands

| Action | Command |
|--------|---------|
| Generate | `npx prisma generate` |
| Migrate (dev) | `npx prisma migrate dev --name <name>` |
| Migrate (prod) | `npx prisma migrate deploy` |
| Seed | `npx prisma db seed` |
| Studio | `npx prisma studio` |
| Build | `npm run build` |
| Test | `npm test` |
| Lint | `npm run lint` |
| Type check | `npm run typecheck` |

---

## Prohibitions — NEVER Do These

1. **NEVER** add HTTP server / API routes — this is a pure data layer
2. **NEVER** use offset pagination (skip/take) — cursor-based only
3. **NEVER** skip `.js` extensions in imports (ESM requirement)
4. **NEVER** create PrismaClient outside `client/index.ts` singleton
5. **NEVER** put Zod schemas inside repository files — separate concerns
6. **NEVER** use `migrate dev` in production — `migrate deploy` only
7. **NEVER** expose raw Prisma errors — always `mapPrismaError()`
8. **NEVER** use `any` type — strict TypeScript
9. **NEVER** skip `@@map()` on models or `@map()` on columns
10. **NEVER** omit `createdAt` / `updatedAt` timestamps on any model
