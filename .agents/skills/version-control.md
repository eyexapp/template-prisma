---
name: version-control
type: knowledge
version: 1.0.0
agent: CodeActAgent
triggers:
  - git
  - commit
  - ci
  - migrations
  - deploy
---

# Version Control — Prisma

## Commits

- `schema: add Order model with user relation`
- `migration: add orders table`
- `feat(repos): add cursor-based pagination`

## CI Pipeline

```bash
npm ci
npx prisma generate           # Generate client
npx tsc --noEmit
npx vitest run
npx prisma migrate deploy     # Apply migrations (production)
```

## Prisma CLI Commands

```bash
npx prisma migrate dev --name add_orders   # Create migration (development)
npx prisma migrate deploy                   # Apply (production)
npx prisma migrate reset                    # Reset DB + re-migrate
npx prisma generate                         # Regenerate client
npx prisma db seed                          # Run seed script
npx prisma studio                           # GUI browser
```

## Seeding

```typescript
// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@example.com",
      password: "hashed_password",
      role: "ADMIN",
    },
  });
}

main().finally(() => prisma.$disconnect());
```

## .gitignore

```
node_modules/
dist/
.env
```

## Environment

```bash
DATABASE_URL="postgresql://user:pass@localhost:5432/myapp?schema=public"
TEST_DATABASE_URL="postgresql://user:pass@localhost:5432/myapp_test?schema=public"
```
