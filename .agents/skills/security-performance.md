---
name: security-performance
type: knowledge
version: 1.0.0
agent: CodeActAgent
triggers:
  - security
  - performance
  - prisma optimization
  - n+1
  - connection pool
---

# Security & Performance — Prisma 6

## Performance

### N+1 Prevention

```typescript
// ❌ N+1: separate query for each user's orders
const users = await prisma.user.findMany();
for (const user of users) {
  const orders = await prisma.order.findMany({ where: { userId: user.id } });
}

// ✅ Include (eager load)
const users = await prisma.user.findMany({
  include: { orders: true },
});

// ✅ Select only needed fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    _count: { select: { orders: true } },
  },
});
```

### Batch Operations

```typescript
// ✅ Use createMany, updateMany, deleteMany
await prisma.user.createMany({
  data: usersArray,
  skipDuplicates: true,
});

// ✅ Transaction for multiple operations
const [users, count] = await prisma.$transaction([
  prisma.user.findMany({ take: 20 }),
  prisma.user.count(),
]);
```

### Connection Pool

```bash
# Tune pool via connection string
DATABASE_URL="postgresql://...?connection_limit=20&pool_timeout=10"
```

### Query Logging

```typescript
const prisma = new PrismaClient({
  log: [
    { emit: "event", level: "query" },
  ],
});

prisma.$on("query", (e) => {
  if (e.duration > 1000) {
    console.warn(`Slow query (${e.duration}ms): ${e.query}`);
  }
});
```

## Security

### SQL Injection Prevention

Prisma parameterizes all queries automatically. No risk with standard API.

```typescript
// ✅ Safe — parameterized
await prisma.user.findMany({ where: { email: userInput } });

// ⚠️ Raw queries — use $queryRaw with template tag
const users = await prisma.$queryRaw`SELECT * FROM users WHERE email = ${email}`;

// ❌ NEVER use $queryRawUnsafe with user input
prisma.$queryRawUnsafe(`SELECT * FROM users WHERE email = '${email}'`);
```

### Field-Level Access Control

```typescript
// Never expose password hash
async function getPublicUser(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, createdAt: true },
    // password excluded
  });
}
```

### Environment Security

- `DATABASE_URL` only in environment variables.
- Different URLs for dev/test/prod.
- Never commit `.env` files.

### Prisma Client Singleton

```typescript
// In serverless: reuse client across invocations
declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = globalThis.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
```
