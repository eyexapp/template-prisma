---
name: architecture
type: knowledge
version: 1.0.0
agent: CodeActAgent
triggers:
  - architecture
  - prisma
  - repository
  - schema
  - database
---

# Architecture — Prisma 6 (Pure Database Access Layer)

## Project Structure (NO HTTP Server)

```
src/
├── index.ts                    ← Library entry (export repositories)
├── client.ts                   ← Prisma client singleton
├── repositories/
│   ├── base.repository.ts      ← Generic BaseRepository<T>
│   ├── user.repository.ts
│   └── order.repository.ts
├── schemas/
│   ├── user.schema.ts          ← Zod validation schemas
│   └── order.schema.ts
├── types/
│   └── index.ts                ← Shared types
└── utils/
    └── pagination.ts
prisma/
├── schema.prisma               ← Prisma schema
├── migrations/
│   ├── 20240101_create_users/
│   │   └── migration.sql
│   └── 20240102_add_orders/
│       └── migration.sql
└── seed.ts                     ← Seed script
```

## Prisma Schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  name      String   @db.VarChar(100)
  email     String   @unique @db.VarChar(255)
  password  String   @db.VarChar(255)
  role      Role     @default(USER)
  orders    Order[]
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("users")
}

model Order {
  id     String      @id @default(uuid())
  total  Decimal     @db.Decimal(10, 2)
  status OrderStatus @default(PENDING)
  userId String      @map("user_id")
  user   User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("orders")
}

enum Role {
  USER
  ADMIN
}

enum OrderStatus {
  PENDING
  COMPLETED
  CANCELLED
}
```

## Prisma Client Singleton

```typescript
// client.ts
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
});
```

## Repository Pattern

```typescript
// repositories/user.repository.ts
import { prisma } from "../client";
import { Prisma } from "@prisma/client";

export class UserRepository {
  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  async create(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data });
  }

  async update(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.user.delete({ where: { id } });
  }

  async findWithOrders(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { orders: true },
    });
  }

  async paginate(cursor?: string, take = 20) {
    return prisma.user.findMany({
      take,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: "desc" },
    });
  }
}
```

## Rules

- Pure database access layer — NO HTTP server, no Express, no API routes.
- Repository pattern wraps Prisma client calls.
- Zod for input validation schemas.
- Prisma for migrations, not raw SQL.
- Export repositories for consumers to import.
