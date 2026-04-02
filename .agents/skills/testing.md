---
name: testing
type: knowledge
version: 1.0.0
agent: CodeActAgent
triggers:
  - test
  - vitest
  - prisma mock
  - integration test
---

# Testing — Prisma (Vitest)

## Unit Tests (Mock Prisma Client)

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockDeep, DeepMockProxy } from "vitest-mock-extended";
import { PrismaClient } from "@prisma/client";

vi.mock("../src/client", () => ({
  prisma: mockDeep<PrismaClient>(),
}));

import { prisma } from "../src/client";
import { UserRepository } from "../src/repositories/user.repository";

const mockPrisma = prisma as unknown as DeepMockProxy<PrismaClient>;

describe("UserRepository", () => {
  const repo = new UserRepository();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should find user by id", async () => {
    const mockUser = { id: "1", name: "Alice", email: "a@b.com" };
    mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);

    const result = await repo.findById("1");
    expect(result?.name).toBe("Alice");
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "1" },
    });
  });

  it("should create user", async () => {
    const input = { name: "Bob", email: "bob@test.com", password: "hash" };
    mockPrisma.user.create.mockResolvedValue({ id: "2", ...input } as any);

    const result = await repo.create(input);
    expect(result.id).toBe("2");
  });
});
```

## Integration Tests (Test DB)

```typescript
import { PrismaClient } from "@prisma/client";

const testPrisma = new PrismaClient({
  datasources: { db: { url: process.env.TEST_DATABASE_URL } },
});

beforeAll(async () => {
  // Run migrations on test DB
  await execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL },
  });
});

afterEach(async () => {
  // Clean tables between tests
  await testPrisma.$transaction([
    testPrisma.order.deleteMany(),
    testPrisma.user.deleteMany(),
  ]);
});

afterAll(async () => {
  await testPrisma.$disconnect();
});
```

## Schema Validation Tests

```typescript
describe("CreateUserSchema", () => {
  it("should accept valid input", () => {
    const result = CreateUserSchema.safeParse({
      name: "Alice",
      email: "alice@test.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid email", () => {
    const result = CreateUserSchema.safeParse({
      name: "Alice",
      email: "not-an-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });
});
```

## Rules

- `vitest-mock-extended` for deep Prisma client mocking.
- Integration tests use separate test database.
- Clean tables between tests with `deleteMany` in transaction.
- Test Zod schemas independently.
