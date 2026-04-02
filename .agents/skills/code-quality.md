---
name: code-quality
type: knowledge
version: 1.0.0
agent: CodeActAgent
triggers:
  - code quality
  - naming
  - prisma schema
  - zod
  - types
---

# Code Quality — Prisma 6

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Model | PascalCase singular | `User`, `Order` |
| Field | camelCase | `createdAt`, `userId` |
| Table (@@map) | plural snake_case | `@@map("users")` |
| Column (@map) | snake_case | `@map("created_at")` |
| Enum | PascalCase | `Role`, `OrderStatus` |
| Enum value | UPPER_SNAKE | `PENDING`, `COMPLETED` |
| Repository | PascalCase + Repository | `UserRepository` |

## Zod Schemas

```typescript
import { z } from "zod";

export const CreateUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["USER", "ADMIN"]).optional(),
});

export const UpdateUserSchema = CreateUserSchema.partial().omit({ password: true });

export const PaginationSchema = z.object({
  cursor: z.string().uuid().optional(),
  take: z.coerce.number().int().min(1).max(100).default(20),
});
```

## Transaction Pattern

```typescript
async function createUserWithOrder(userData: CreateUserInput, orderData: CreateOrderInput) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data: userData });
    const order = await tx.order.create({
      data: { ...orderData, userId: user.id },
    });
    return { user, order };
  });
}
```

## Type-Safe Selects

```typescript
// Select only needed fields (reduces transfer)
async function getUserSummaries() {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      _count: { select: { orders: true } },
    },
  });
}
// Return type: { id: string; name: string; email: string; _count: { orders: number } }[]
```

## Middleware (Soft Delete)

```typescript
prisma.$use(async (params, next) => {
  if (params.model === "User" && params.action === "delete") {
    params.action = "update";
    params.args.data = { deletedAt: new Date() };
  }
  return next(params);
});
```

## Error Handling

```typescript
import { Prisma } from "@prisma/client";

try {
  await userRepo.create(data);
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") throw new ConflictError("Unique constraint violated");
    if (error.code === "P2025") throw new NotFoundError("Record not found");
  }
  throw error;
}
```
